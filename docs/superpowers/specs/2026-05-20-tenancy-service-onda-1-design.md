# Design: `tenancy-service` (Onda 1)

- **Data**: 2026-05-20
- **Status**: aprovado em brainstorming, pronto para implementação
- **Owner**: @olucianochagas
- **Tags**: tenancy, users, lgpd, pii, onda-1
- **Contexto**: 1 de 3 specs do IAM Onda 1 (ver [ADR-0011](../../adr/0011-divisao-iam-em-tres-services.md))

---

## 1. Visão geral

Service responsável por **donatário de `Tenant` e `User`** — incluindo PII cifrada (email), credencial (`password_hash` argon2id), ciclo `active/deactivated`. Não emite JWT, não conhece roles, não gerencia sessão. Apenas administra as identidades.

- **Porta**: `3010` · **Schema PG**: `tenancy` · **Path**: `apps/tenancy-service/`
- **HTTP adapter**: `@nestjs/platform-fastify` · **Validation**: class-validator + ValidationPipe
- **PII**: `email` cifrado via `LocalKmsProvider` (HKDF + AES-256-GCM); `email_hash` HMAC-SHA256 para busca
- **Eventos publicados** (NATS via outbox):
  - `tenancy.tenant.created` — provisionamento (via CLI ou admin)
  - `tenancy.tenant.deactivated` — soft-delete
  - `tenancy.user.created` — payload inclui `roles: string[]` para o authz-service consumir
  - `tenancy.user.deactivated` — authn-service revoga refresh tokens; authz revoga roles
- **Eventos consumidos**: nenhum em Onda 1
- **Consumido por** (HTTP interno):
  - `authn-service` no login (`GET /internal/tenants/by-slug`, `GET /internal/users/lookup`)

## 2. Endpoints HTTP

### Públicos (admin only)

| Method   | Path                              | Role           | Body / Query                  | Response                             |
| -------- | --------------------------------- | -------------- | ----------------------------- | ------------------------------------ |
| `POST`   | `/tenants`                        | `admin`        | `CreateTenantDto`             | `TenantDto` (201)                    |
| `GET`    | `/tenants`                        | `admin`        | `ListTenantsQueryDto`         | `PaginatedDto<TenantDto>`            |
| `GET`    | `/tenants/:id`                    | `admin`        | —                             | `TenantDto`                          |
| `DELETE` | `/tenants/:id`                    | `admin`        | `DeactivateTenantDto`         | `204`                                |
| `POST`   | `/tenants/:tenantId/users`        | `admin`        | `CreateUserDto`               | `UserDto` (201)                      |
| `GET`    | `/tenants/:tenantId/users`        | `admin`/gestor | `ListUsersQueryDto`           | `PaginatedDto<UserDto>`              |
| `GET`    | `/users/:id`                      | `admin`/owner  | —                             | `UserDto`                            |
| `PATCH`  | `/users/:id`                      | `admin`/owner  | `UpdateUserDto`               | `UserDto`                            |
| `DELETE` | `/users/:id`                      | `admin`        | `DeactivateUserDto`           | `204`                                |

### Internal (HMAC-signed; consumidos por authn-service)

| Method | Path                                                   | Quem chama   | Retorno                                                                  |
| ------ | ------------------------------------------------------ | ------------ | ------------------------------------------------------------------------ |
| `GET`  | `/internal/tenants/by-slug?slug=<s>`                   | authn-service | `{ id, slug, name, status, plan }` ou 404                                |
| `GET`  | `/internal/users/lookup?tenant_id=<id>&email_hash=<h>` | authn-service | `{ id, tenant_id, password_hash, status, name }` ou 404                  |
| `GET`  | `/internal/users/:id`                                  | authn-service | `{ id, tenant_id, email, name, status }` (email **decifrado**) ou 404    |

## 3. Schema Prisma (`schema=tenancy`)

```prisma
model Tenant {
  id                  String              @id @default(uuid()) @db.Uuid
  slug                String              @unique @db.VarChar(64)
  name                String              @db.VarChar(200)
  plan                Plan                @default(starter)
  status              TenantStatus        @default(active)
  created_at          DateTime            @default(now())
  updated_at          DateTime            @updatedAt
  deactivated_at      DateTime?
  deactivation_reason DeactivationReason?

  users User[]

  @@index([status])
  @@schema("tenancy")
}

enum Plan               { free starter pro enterprise  @@schema("tenancy") }
enum TenantStatus       { active deactivated  @@schema("tenancy") }
enum DeactivationReason { contract_ended data_breach unpaid manual  @@schema("tenancy") }

model User {
  id              String  @id @default(uuid()) @db.Uuid
  tenant_id       String  @db.Uuid
  email_encrypted Bytes
  email_hash      String  @db.Char(64)
  email_kms_kid   String  @db.VarChar(128)
  name            String  @db.VarChar(120)
  password_hash   String  @db.VarChar(255)
  status          UserStatus @default(active)

  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  deactivated_at  DateTime?
  deactivation_reason UserDeactivationReason?
  last_login_at   DateTime?  // atualizado via PATCH /internal/users/:id/last-login pelo authn

  tenant Tenant @relation(fields: [tenant_id], references: [id])

  @@unique([tenant_id, email_hash])
  @@index([tenant_id, status])
  @@schema("tenancy")
}

enum UserStatus             { active deactivated  @@schema("tenancy") }
enum UserDeactivationReason { voluntary role_revoked security_incident data_breach  @@schema("tenancy") }

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
  @@schema("tenancy")
}
```

## 4. Módulos Nest

- Infra: `EnvModule`, `PinoLoggerModule`, `ContextModule`, `ThrottleModule`, `PrismaModule`, `KmsModule` (com `LocalKmsProvider` + `EncryptionService`), `HealthModule`
- Internal API auth: `InternalAuthModule` (HMAC guard para `/internal/*`)
- Domain: `TenantModule` (controller + service + repository), `UserModule` (controller + service + repository + PasswordService argon2id)
- Outbox: `OutboxModule` (`PrismaTenancyOutboxStore` + dispatcher @Cron 2s)
- CLI: `CliModule` (`tenant:create`, `tenant:list`, `user:create`, `user:list`)

`AuthGuard` global verifica JWT (assinado pelo authn-service, validado via cache de JWKS pública). `RolesGuard` valida `@Roles('admin')` etc.

## 5. CLI bootstrap

```bash
pnpm --filter @mais-inclusao/tenancy-service cli tenant:create --slug=sec-sp --name="Sec SP" --plan=enterprise
pnpm --filter @mais-inclusao/tenancy-service cli user:create --tenant=sec-sp --email=admin@x.gov.br --password=... --roles=admin
```

`BOOTSTRAP_TOKEN_HASH` via env. `user:create` emite `tenancy.user.created` com `roles[]` no payload — authz-service consome.

## 6. Definition of Done

- [ ] Schema Prisma + migration initial em CI fresh DB
- [ ] 35+ tests verdes (10 unit + 20 integration Testcontainers + 5 internal HTTP)
- [ ] Coverage ≥ 90/85/90/90
- [ ] CLI funciona (`tenant:create`, `user:create`)
- [ ] PII roundtrip: email cifrado + email_hash lookup + decrypt
- [ ] Internal HTTP `/internal/users/lookup` retorna shape correto + HMAC validado
- [ ] Outbox dispatcher publica `tenancy.user.created` em NATS com `roles[]` no payload
- [ ] Dockerfile builda + `/health/ready` 200
- [ ] Cross-tenant test (admin de A não acessa users de B) → 403

## 7. Pendências Onda 2

- Self-service signup (sem precisar de admin)
- Roles customizadas (`is_system=false`) — UI no `tenancy-service` ou movido para authz
- LGPD direitos do titular (export, deletion)
- Auditoria detalhada (`@mais-inclusao/audit` package)
