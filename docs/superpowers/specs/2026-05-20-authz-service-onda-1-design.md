# Design: `authz-service` (Onda 1)

- **Data**: 2026-05-20
- **Status**: aprovado em brainstorming, pronto para implementação
- **Owner**: @olucianochagas
- **Tags**: authorization, rbac, onda-1
- **Contexto**: 1 de 3 specs do IAM Onda 1 (ver [ADR-0011](../../adr/0011-divisao-iam-em-tres-services.md))

---

## 1. Visão geral

Service responsável pelo **catálogo de `Role`/`Permission`** e atribuições `UserRole`. Não conhece tenants (só os referencia via FK lógica) e não conhece passwords/sessions. Foco em **autorização**: "que permissions tem o usuário X?".

- **Porta**: `3020` · **Schema PG**: `authz` · **Path**: `apps/authz-service/`
- **HTTP adapter**: `@nestjs/platform-fastify` · **Validation**: class-validator
- **Cache**: in-memory de role→permissions, populado em `OnModuleInit` + refresh on `authz.role.changed` event (Onda 2)
- **Eventos publicados** (NATS via outbox):
  - `authz.user_role.granted`
  - `authz.user_role.revoked`
- **Eventos consumidos**:
  - `tenancy.user.created` → atribui roles default conforme `payload.roles[]`
  - `tenancy.user.deactivated` → revoga todos `UserRole` do user
  - `tenancy.tenant.deactivated` → revoga todos `UserRole` do tenant
- **Consumido por** (HTTP interno):
  - `authn-service` no login (`GET /internal/users/:userId/roles`)

## 2. Endpoints HTTP

### Públicos

| Method   | Path                            | Role          | Body                    | Response                  |
| -------- | ------------------------------- | ------------- | ----------------------- | ------------------------- |
| `GET`    | `/roles`                        | qualquer      | —                       | `RoleDto[]`               |
| `GET`    | `/roles/:slug/permissions`      | qualquer      | —                       | `PermissionDto[]`         |
| `GET`    | `/users/:userId/roles`          | `admin`/owner | —                       | `RoleDto[]`               |
| `POST`   | `/users/:userId/roles`          | `admin`       | `AssignRoleDto`         | `UserRoleDto` (201)       |
| `DELETE` | `/users/:userId/roles/:slug`    | `admin`       | —                       | `204`                     |

### Internal (HMAC-signed; consumidos por authn-service)

| Method | Path                                      | Quem chama   | Retorno                              |
| ------ | ----------------------------------------- | ------------ | ------------------------------------ |
| `GET`  | `/internal/users/:userId/roles`           | authn-service | `string[]` (slugs de roles ativas)  |
| `GET`  | `/internal/users/:userId/permissions`     | authn-service (futuro) | `string[]` (slugs de permissions)   |

## 3. Schema Prisma (`schema=authz`)

```prisma
model Role {
  id          String   @id @default(uuid()) @db.Uuid
  slug        String   @unique @db.VarChar(32)
  name        String   @db.VarChar(64)
  description String?  @db.VarChar(256)
  is_system   Boolean  @default(true)
  created_at  DateTime @default(now())

  permissions RolePermission[]
  user_roles  UserRole[]

  @@schema("authz")
}

model Permission {
  id          String   @id @default(uuid()) @db.Uuid
  slug        String   @unique @db.VarChar(64)
  description String?  @db.VarChar(256)
  created_at  DateTime @default(now())

  roles RolePermission[]

  @@schema("authz")
}

model RolePermission {
  role_id       String @db.Uuid
  permission_id String @db.Uuid

  role       Role       @relation(fields: [role_id], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permission_id], references: [id], onDelete: Cascade)

  @@id([role_id, permission_id])
  @@schema("authz")
}

model UserRole {
  user_id    String   @db.Uuid  // FK lógica para tenancy.user.id
  tenant_id  String   @db.Uuid  // FK lógica para tenancy.tenant.id (defesa cross-tenant)
  role_id    String   @db.Uuid
  granted_at DateTime @default(now())
  granted_by String   @db.Uuid  // user_id de quem atribuiu (FK lógica)
  revoked_at DateTime?
  revoked_reason String?

  role Role @relation(fields: [role_id], references: [id])

  @@id([user_id, role_id])
  @@index([user_id, revoked_at])
  @@index([tenant_id])
  @@schema("authz")
}

model OutboxEvent {
  id             String   @id @default(uuid()) @db.Uuid
  event_id       String   @unique @db.Uuid
  event_type     String   @db.VarChar(80)
  event_version  String   @db.VarChar(10)
  tenant_id      String   @db.Uuid
  correlation_id String   @db.Uuid
  causation_id   String?  @db.Uuid
  occurred_at    DateTime
  payload        Json
  created_at     DateTime @default(now())
  dispatched_at  DateTime?
  retry_count    Int      @default(0)
  last_error     String?  @db.Text

  @@index([dispatched_at, created_at])
  @@index([tenant_id])
  @@schema("authz")
}
```

## 4. Seed Prisma (idempotente, dev/CI)

```typescript
// 3 roles + 14 permissions + role_permission mapping (mesmo do spec original SUPERSEDED)
const ROLES = [
  { slug: 'admin',   name: 'Administrador' },
  { slug: 'gestor',  name: 'Gestor' },
  { slug: 'triagem', name: 'Triagem' },
];

const PERMISSIONS = [
  'authn.session.read',         'authz.user_role.read',
  'tenancy.tenant.write',       'tenancy.tenant.read',
  'tenancy.user.write',         'tenancy.user.read',
  'programs.program.write',     'programs.program.publish', 'programs.program.read',
  'citizens.citizen.write',     'citizens.citizen.read',
  'applications.application.write', 'applications.application.read',
  'applications.triage.write',
];

// admin → todas; gestor → CRUD domain (programs/citizens/applications + auth.user.read);
// triagem → triage + leituras
```

## 5. NATS event consumers (Onda 1)

`NatsConsumerModule` registra listeners durables:

- `tenancy.user.created` (queue `authz-user-created`): atribui `UserRole` para cada slug em `payload.roles[]`. Idempotente via `(user_id, role_id)` unique.
- `tenancy.user.deactivated` (queue `authz-user-deactivated`): seta `revoked_at` em todos `UserRole` ativos do user.
- `tenancy.tenant.deactivated` (queue `authz-tenant-deactivated`): batch revoke por `tenant_id`.

Falha de consumer → retry via JetStream (max 5x); após isso → DLQ + alerta.

## 6. Definition of Done

- [ ] Schema Prisma + migration initial
- [ ] Seed roda idempotente (3 roles + 14 permissions + mappings)
- [ ] Cache role→permissions populado em OnModuleInit, refresh manual via `RoleService.refreshCache()`
- [ ] 30+ tests verdes (unit + integration)
- [ ] Coverage ≥ 90/85/90/90
- [ ] Internal HTTP `/internal/users/:userId/roles` valida HMAC + retorna roles ativas
- [ ] NATS consumers funcionam (test integration com JetStream em Testcontainer)
- [ ] Cross-tenant test: roles de A não visíveis para admin de B

## 7. Pendências Onda 2

- Roles customizadas por tenant (`is_system=false`)
- Permission hierarchy (parent/child)
- Permission revoke por usuário (override de role)
- ABAC (atributos: `time-based access`, `IP allowlist`)
