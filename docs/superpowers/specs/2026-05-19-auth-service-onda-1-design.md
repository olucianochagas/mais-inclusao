# Design: `auth-service` (Onda 1) — Identity + Tenancy [SUPERSEDED]

> **⚠️ SUPERSEDED em 2026-05-20** pelo [ADR-0011](../../adr/0011-divisao-iam-em-tres-services.md). O IAM foi dividido em **3 services** desde a Onda 1: [tenancy-service](./2026-05-20-tenancy-service-onda-1-design.md), [authz-service](./2026-05-20-authz-service-onda-1-design.md), [authn-service](./2026-05-20-authn-service-onda-1-design.md). Este documento permanece como referência histórica das decisões consolidadas (Fastify + class-validator + RS256 + refresh com famílias + KMS local + outbox + cross-tenant defense em profundidade) que foram preservadas nos 3 novos specs.

- **Data**: 2026-05-19
- **Status**: **SUPERSEDED** (substituído por 3 specs separados conforme ADR-0011)
- **Owner**: @olucianochagas
- **Tags**: auth, multi-tenancy, lgpd, jwt, rbac, onda-1
- **Nota histórica**: spec original de 2026-05-18 (859 linhas, commits `bcdb0e1` … `290f861`) foi perdido em reset de workspace antes de ser pushado. Esta versão reconstrói as decisões já validadas, incluindo escolha de **Fastify + class-validator** (decisões alinhadas ao padrão oficial NestJS 11).

---

## 1. Visão geral

Primeiro service de domínio do +Inclusão. Materializa identidade + tenancy + RBAC para gestores, e é o gate de autenticação para todos os demais services do monorepo (`programs-service`, `applications-service`, `citizens-service`, BFFs).

- **Porta**: `3010`
- **Schema PostgreSQL**: `auth`
- **Local no monorepo**: `apps/auth-service/`
- **HTTP adapter**: **`@nestjs/platform-fastify`** (Pino é o logger nativo do Fastify; 2-3x throughput vs Express)
- **Validation stack**: **class-validator + class-transformer + ValidationPipe global** (padrão oficial NestJS 11)
- **Error envelope**: ProblemDetails RFC 9457
- **Eventos publicados**: `auth.tenant.created`, `auth.tenant.deactivated`, `auth.user.created`, `auth.user.deactivated` (4, schemas Zod em [`@mais-inclusao/contracts/auth/events.ts`](../../../packages/contracts/src/auth/events.ts))
- **Endpoints HTTP**: 16 (5 públicos + 11 autenticados) — esquemas DTO redefinidos como classes class-validator dentro do service

### Responsabilidades Onda 1

- Provisionar `Tenant` via CLI + ciclo `active → deactivated`.
- CRUD de `User` (gestor) dentro de tenant + ciclo `active → deactivated`.
- Catálogo fixo de `Role` (`admin`, `gestor`, `triagem`) + atribuição `user_role`.
- Mapping `role_permission` (DB-side; JWT só carrega roles).
- Emitir JWT RS256 (15min TTL) + refresh com rotação + famílias (7d TTL).
- JWKS endpoint `/.well-known/jwks.json` para outros services validarem JWT.
- Outbox dispatcher dos 4 eventos `auth.*` via NATS JetStream (engine de [`@mais-inclusao/messaging`](../../../packages/messaging/) + adapter Prisma).

### Fora do escopo Onda 1

- MFA (Onda 2)
- SSO / SAML / OIDC externo (Onda 3)
- Self-service de tenant (operador via CLI por enquanto)
- Identidade do cidadão (vem em `citizen-identity-service`, Onda 2)
- Customizar roles por tenant (Onda 2)
- Email transactional (welcome, reset password) — Onda 2 com `notifications-service`

### Dependências externas

| Dependência    | Versão         | Uso                               |
| -------------- | -------------- | --------------------------------- |
| PostgreSQL     | 16+            | schema `auth`                     |
| NATS JetStream | 2.10+          | publish dos 4 eventos             |
| KMS            | local (Onda 1) | env var; Onda 2 → AWS KMS / Vault |

### Dependências internas (do monorepo)

| Package                                                   | Por quê                                                                                                |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `@mais-inclusao/contracts`                                | Schemas Zod de **eventos NATS** (single source of truth) + IDs branded                                 |
| `@mais-inclusao/persistence`                              | TenantContext (ALS), scope helpers, errors; **adicionar `KmsProvider` interface + `hmacSha256` helper** |
| `@mais-inclusao/messaging`                                | `OutboxDispatcher` engine + NATS publisher (auth-service implementa `OutboxStore` adapter Prisma)      |
| `@mais-inclusao/observability`                            | Pino logger + correlation-id helpers + OTel                                                            |
| `@mais-inclusao/tsconfig`, `@mais-inclusao/eslint-config` | Tooling shared                                                                                         |

**Pré-requisito**: implementar `KmsProvider` + `hmacSha256` em `packages/persistence` antes ou junto do auth-service.

---

## 2. Decisões arquiteturais

| #   | Decisão            | Escolha                                                                                          | Razão                                                                                                                |
| --- | ------------------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| 1   | HTTP adapter       | **Fastify** (`@nestjs/platform-fastify`) com Pino nativo                                         | 2-3x throughput vs Express; logger Pino integrado; oficialmente suportado pelo NestJS                                |
| 2   | Validação HTTP     | **class-validator + class-transformer + ValidationPipe global** + `exceptionFactory` ProblemDetails | Padrão oficial NestJS 11; integração com `@nestjs/swagger`; decorators co-localizados com DTO; eventos NATS continuam em Zod (contracts) |
| 3   | Refresh token      | **Stateful com rotação + famílias** (defesa contra theft replay)                                 | Revogabilidade + LGPD audit + padrão Auth0/Okta                                                                      |
| 4   | RBAC               | **Roles como strings no JWT + permissions no DB**                                                | JWT enxuto + lookup local em memória (cache no RoleService)                                                          |
| 5   | PII (email)        | **ADR-0006 full + `KmsProvider` mode local em Onda 1**                                           | Cumpre LGPD desde dia 1; troca de provider sem mudar código em Onda 2                                                |
| 6   | Bootstrap          | **CLI integrado ao service + seed Prisma dev/CI**                                                | Idiomático SaaS B2B + dev-friendly                                                                                   |
| 7   | JWT alg            | **RS256 com JWKS endpoint**                                                                      | Auth-service é único guardião da chave privada; outros services validam via JWKS pública                             |
| 8   | TTL tokens         | **Access 15min + Refresh 7d**                                                                    | Padrão moderno (Auth0, Supabase); rotação compensa refresh longo                                                     |
| 9   | Outbox worker      | **Mesmo processo Nest** (`@Cron` 2s)                                                             | 1 deploy, 1 monitor; pode separar em Onda 2 se virar gargalo                                                         |
| 10  | Testing            | **Vitest + Testcontainers (Postgres 16-alpine)**                                                 | 90%+ coverage com mínimo mocking; bugs reais                                                                         |
| 11  | Module structure   | **Domain feature modules** (Auth, Tenant, User, Role, Outbox, Kms, JWKS, CLI, Health, Context)   | Boundaries explícitos + onboarding mais fácil                                                                        |
| 12  | Argon2id           | **OWASP 2025: 19MiB / 2 iterations / 1 parallelism**                                             | ~500ms/hash; equilíbrio segurança/UX                                                                                 |
| 13  | Rate limit + audit | **`@nestjs/throttler` interno + audit via Pino estruturado**                                     | Defesa em profundidade (BFF + service); `@mais-inclusao/audit` package em Onda 2                                     |

---

## 3. Schema Prisma (`schema=auth`)

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-arm64-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["auth"]
}

// ─── Tenancy ─────────────────────────────────────────────────

model Tenant {
  id                  String   @id @default(uuid()) @db.Uuid
  slug                String   @unique @db.VarChar(64)
  name                String   @db.VarChar(200)
  plan                Plan     @default(starter)
  status              TenantStatus @default(active)
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
  deactivated_at      DateTime?
  deactivation_reason DeactivationReason?

  users               User[]
  refresh_tokens      RefreshToken[]

  @@index([status])
  @@schema("auth")
}

enum Plan               { free starter pro enterprise }
enum TenantStatus       { active deactivated }
enum DeactivationReason { contract_ended data_breach unpaid manual }

// ─── Users ───────────────────────────────────────────────────

model User {
  id              String   @id @default(uuid()) @db.Uuid
  tenant_id       String   @db.Uuid

  /// email cifrado AES-256-GCM via KmsProvider
  email_encrypted Bytes
  /// HMAC-SHA256(email_normalized) com pepper global — usado em login
  email_hash      String   @db.Char(64)
  /// kid do KMS para decifrar (multi-version)
  email_kms_kid   String   @db.VarChar(128)

  name            String   @db.VarChar(120)
  password_hash   String   @db.VarChar(255) // argon2id encoded
  status          UserStatus @default(active)

  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  deactivated_at  DateTime?
  deactivation_reason UserDeactivationReason?
  last_login_at   DateTime?

  tenant          Tenant   @relation(fields: [tenant_id], references: [id])
  user_roles      UserRole[]
  refresh_tokens  RefreshToken[]

  @@unique([tenant_id, email_hash]) // email único por tenant
  @@index([tenant_id, status])
  @@schema("auth")
}

enum UserStatus             { active deactivated }
enum UserDeactivationReason { voluntary role_revoked security_incident data_breach }

// ─── RBAC ────────────────────────────────────────────────────

model Role {
  id           String   @id @default(uuid()) @db.Uuid
  slug         String   @unique @db.VarChar(32)
  name         String   @db.VarChar(64)
  description  String?  @db.VarChar(256)
  is_system    Boolean  @default(true)
  created_at   DateTime @default(now())

  permissions  RolePermission[]
  user_roles   UserRole[]

  @@schema("auth")
}

model Permission {
  id           String   @id @default(uuid()) @db.Uuid
  slug         String   @unique @db.VarChar(64)
  description  String?  @db.VarChar(256)
  created_at   DateTime @default(now())

  roles        RolePermission[]

  @@schema("auth")
}

model RolePermission {
  role_id       String @db.Uuid
  permission_id String @db.Uuid

  role        Role       @relation(fields: [role_id], references: [id], onDelete: Cascade)
  permission  Permission @relation(fields: [permission_id], references: [id], onDelete: Cascade)

  @@id([role_id, permission_id])
  @@schema("auth")
}

model UserRole {
  user_id    String   @db.Uuid
  role_id    String   @db.Uuid
  granted_at DateTime @default(now())
  granted_by String   @db.Uuid

  user  User @relation(fields: [user_id], references: [id], onDelete: Cascade)
  role  Role @relation(fields: [role_id], references: [id])

  @@id([user_id, role_id])
  @@schema("auth")
}

// ─── Refresh tokens (stateful + rotação + famílias) ─────────

model RefreshToken {
  id             String   @id @default(uuid()) @db.Uuid
  family_id      String   @db.Uuid
  user_id        String   @db.Uuid
  tenant_id      String   @db.Uuid

  /// SHA-256 do token raw (token raw nunca persistido)
  token_hash     String   @unique @db.Char(64)
  expires_at     DateTime
  created_at     DateTime @default(now())
  used_at        DateTime?
  rotated_to     String?  @db.Uuid

  revoked_at     DateTime?
  revoked_reason RevokeReason?

  user   User   @relation(fields: [user_id], references: [id], onDelete: Cascade)
  tenant Tenant @relation(fields: [tenant_id], references: [id], onDelete: Cascade)

  @@index([family_id])
  @@index([user_id, expires_at])
  @@schema("auth")
}

enum RevokeReason { logout user_deactivated reused token_theft_replay }

// ─── Outbox ──────────────────────────────────────────────────

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
  @@schema("auth")
}
```

---

## 4. Estrutura de módulos Nest

```
AppModule
├── ConfigModule          env vars validados via Zod schema (src/env.ts)
├── LoggerModule          Pino do @mais-inclusao/observability
├── PrismaModule          PrismaClient singleton
├── KmsModule             PROVIDER pattern: LocalKmsProvider em Onda 1
├── ContextModule         ALS de correlation_id (interceptor global)
├── ThrottleModule        @nestjs/throttler com 4 named limits
├── HealthModule          /health/live, /health/ready
├── JwksModule            /.well-known/jwks.json + RS256 keys
│
├── AuthModule            login, refresh, logout, /me + global guards
├── TenantModule          CRUD tenants (admin)
├── UserModule            CRUD users no tenant
├── RoleModule            Read-only catalog + cache de role→permissions
├── OutboxModule          @Cron 2s dispatcher
└── CliModule             NestCommander subapp
```

**ValidationPipe global** (em `main.ts`): `transform: true`, `whitelist: true`, `forbidNonWhitelisted: true`, `exceptionFactory` → `ProblemDetailsException` (RFC 9457, status 422). Defesa contra mass assignment.

**AuthGuard global**: registrado como `APP_GUARD`. Verifica JWT em todo endpoint, exceto rotas marcadas com `@Public()`.

**Decorators DTO** (class-validator) co-localizados em `src/<modulo>/dto/*.dto.ts`. Exemplo:

```typescript
// src/auth/dto/login.dto.ts
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString() @IsEmail() @MaxLength(254)
  email!: string;

  @IsString() @Length(12, 256)
  password!: string;

  @IsString() @Length(1, 64)
  tenant_slug!: string;
}
```

---

## 5. Endpoints HTTP

Throttle defaults:
- Públicos sem throttle especial: `default` (100/min) ou unlimited (health)
- `/.well-known/jwks.json`: `jwks` (1000/min)
- `/auth/login`: `auth-login` (5/min/IP)
- `/auth/refresh`: `auth-refresh` (60/min/IP)
- Autenticados: `default` (100/min/user)

### Públicos (`@Public()`)

| Method | Path                      | DTO            | Response           | Throttle      |
| ------ | ------------------------- | -------------- | ------------------ | ------------- |
| `GET`  | `/.well-known/jwks.json`  | —              | RFC 7517 JWKS      | 1000/min      |
| `GET`  | `/health/live`            | —              | `200 OK`           | unlimited     |
| `GET`  | `/health/ready`           | —              | `200 OK` (DB+KMS)  | unlimited     |
| `POST` | `/auth/login`             | `LoginDto`     | `AuthTokensDto`    | **5/min/IP**  |
| `POST` | `/auth/refresh`           | `RefreshDto`   | `AuthTokensDto`    | **60/min/IP** |

### Autenticados (AuthGuard + `@Roles()`)

| Method   | Path                              | Role             | DTO                       | Response                          |
| -------- | --------------------------------- | ---------------- | ------------------------- | --------------------------------- |
| `GET`    | `/me`                             | qualquer         | —                         | `MeResponseDto`                   |
| `POST`   | `/auth/logout`                    | qualquer         | `LogoutDto`               | `204`                             |
| `GET`    | `/roles`                          | qualquer         | —                         | `RoleDto[]`                       |
| `GET`    | `/roles/:slug/permissions`        | qualquer         | —                         | `PermissionDto[]`                 |
| `POST`   | `/tenants`                        | `admin`          | `CreateTenantDto`         | `TenantDto` (201)                 |
| `GET`    | `/tenants`                        | `admin`          | `ListTenantsQueryDto`     | `PaginatedDto<TenantDto>`         |
| `GET`    | `/tenants/:id`                    | `admin`          | —                         | `TenantDto`                       |
| `DELETE` | `/tenants/:id`                    | `admin`          | `DeactivateTenantDto`     | `204`                             |
| `POST`   | `/tenants/:tenantId/users`        | `admin`          | `CreateUserDto`           | `UserDto` (201)                   |
| `GET`    | `/tenants/:tenantId/users`        | `admin`/`gestor` | `ListUsersQueryDto`       | `PaginatedDto<UserDto>`           |
| `GET`    | `/users/:id`                      | `admin`/owner    | —                         | `UserDto`                         |
| `PATCH`  | `/users/:id`                      | `admin`/owner    | `UpdateUserDto`           | `UserDto`                         |
| `DELETE` | `/users/:id`                      | `admin`          | `DeactivateUserDto`       | `204`                             |

### Error responses

ProblemDetails RFC 9457 via `ProblemDetailsFilter` global. Códigos: `401`, `403` (cross-tenant logged via metric `tenant_id_mismatch_total`), `404`, `409`, `422` (ValidationPipe), `429`, `500`, `503` (KMS down).

---

## 6. Fluxos críticos

### 6.1 Login

```
1. ValidationPipe valida LoginDto (422 ProblemDetails se falha)
2. ThrottlerGuard verifica 5/min/IP
3. tenantService.findBySlug → 401 se não existe ou deactivated
4. emailHash = HMAC-SHA256(normalize(email), EMAIL_HASH_PEPPER)
5. userService.findByEmailHash(tenant_id, emailHash)
   ⤷ se null: passwordService.verifyAgainstDummy(input.password) (timing defense)
6. argon2.verify(user.password_hash, password) → 401 se mismatch
7. user.status === 'active' → 401 se deactivated
8. roles = userRoleRepo.findRolesForUser(user_id)
9. accessToken = tokenService.signAccess({user_id, tenant_id, roles}, 15min)
10. refreshToken = tokenService.createRefresh(user, new family_id)
    → INSERT auth.refresh_token (token_hash = SHA-256(raw))
11. UPDATE user.last_login_at
12. Pino audit log: { audit: true, action: 'login.success', actor_id, tenant_id }
→ 200 AuthTokensDto { access_token, refresh_token, expires_in: 900, token_type: 'Bearer' }
```

### 6.2 Refresh (com rotação + reuse detection)

```
1. ValidationPipe + Throttler (60/min)
2. tokenHash = SHA-256(refresh_token raw)
3. row = refreshTokenRepo.findByHash → 401 se null
4. row.revoked_at IS NOT NULL → 401 + audit
5. row.expires_at < now() → 401
6. row.used_at IS NOT NULL → TOKEN THEFT REPLAY:
   6a. refreshTokenRepo.revokeFamily(row.family_id, 'token_theft_replay')
   6b. Pino audit ERROR + metric `auth_token_theft_total++`
   6c. 401 (cliente legítimo perde sessão; atacante perde acesso)
7. user.status === 'active' → 401 se deactivated
8. newAccess + newRefresh (mesma family_id, novo token_hash)
9. UPDATE row SET used_at=now(), rotated_to=newRefresh.id
10. Pino audit: { action: 'refresh.rotated', family_id }
→ 200 AuthTokensDto
```

### 6.3 PII encryption (email)

```
SAVE:
  emailNormalized = email.toLowerCase().trim()
  emailHash = HMAC-SHA256(emailNormalized, GLOBAL_PEPPER)
  dek = kms.deriveDek(tenant_id, nonce=random_16_bytes)
  emailEncrypted = AES-256-GCM.encrypt(emailNormalized, dek)
    → produces: nonce(12) | ciphertext | auth_tag(16)
  INSERT user { email_encrypted, email_hash, email_kms_kid, ... }

LOOKUP:
  emailHash = HMAC-SHA256(normalize(email), GLOBAL_PEPPER)
  SELECT * FROM user WHERE tenant_id=$1 AND email_hash=$2

DECRYPT (/me, listagem admin):
  dek = kms.deriveDek(tenant_id, nonce_from_row, kid=row.email_kms_kid)
  emailNormalized = AES-256-GCM.decrypt(row.email_encrypted, dek)
  retorna no DTO (autorizado pelo guard)
```

### 6.4 Outbox dispatch

```
@Cron('*/2 * * * * *') OutboxDispatcherService.tick():
  result = dispatcher.dispatch()  // engine de @mais-inclusao/messaging
    ⤷ store.claimBatch(50)        // PrismaAuthOutboxStore adapter
    ⤷ for each event: publisher.publish(event)  // NATS via @mais-inclusao/messaging
    ⤷ store.markDispatched(id, …)
    ⤷ on error: store.markFailed(id, …)
  if result.dispatched > 0: log.info({ event: 'outbox.dispatched', count })
```

### 6.5 Tenant deactivation cascade

```
DELETE /tenants/:id { reason: 'data_breach' }:
  TX BEGIN:
    1. tenantRepo.update(id, status='deactivated', reason)
    2. refreshTokenRepo.revokeManyByTenant(id, 'user_deactivated')
    3. outboxEvent.create('auth.tenant.deactivated', payload)
  COMMIT
  → cron dispatcher publica em ~2s
```

### Invariante crítica (ADR-0005, Camada 6)

A métrica `tenant_id_mismatch_total` deve permanecer **sempre 0 em produção**. Qualquer increment dispara alerta crítico imediato. Testada via E2E.

---

## 7. CLI + bootstrap + seed

### CLI (NestCommander)

Compartilha `AppModule` com o HTTP server — mesmos providers, mesmas regras de negócio.

```bash
$ pnpm --filter @mais-inclusao/auth-service cli --help

Comandos:
  tenant:create  --slug=<s> --name=<n> [--plan=starter]
  tenant:list
  user:create    --tenant=<slug> --email=<e> --name=<n> --password=<p> [--roles=admin]
  user:list      --tenant=<slug>
  rotate-jwt-keys                 (Onda 2)
```

Autenticação: `BOOTSTRAP_TOKEN_HASH` em env (argon2id hash). Comparação via `argon2.verify` (constant-time).

### Prisma seed

`prisma/seed.ts` (idempotente, dev/CI only via `NODE_ENV=development`).

Cria:

- 3 `Role`: `admin`, `gestor`, `triagem`
- ~14 `Permission` (`auth.tenant.*`, `auth.user.*`, `programs.program.*`, `applications.application.*`, etc.)
- `RolePermission` mapping (admin → todas, gestor → CRUD domain, triagem → triage + leituras)
- 1 `Tenant` `_dev` (slug `dev-tenant`, plan `enterprise`) — só em dev
- 1 `User` admin (`admin@dev.local`, password `admin12345!`) — só em dev

### Migrations

- **Dev**: `pnpm db:migrate dev`
- **CI/Prod**: `pnpm db:migrate deploy`
- Migration files em `apps/auth-service/prisma/migrations/`, commitados

---

## 8. Testing strategy

### Pirâmide (~70 testes)

```
E2E (~5 testes)
─ login-flow          HTTP → DB → outbox → NATS mock
─ refresh-rotation    success + reuse detection
─ me                  token válido retorna user + tenant + roles
─ cross-tenant-access gestor de A → 403 em recurso de B (Camada 6 ADR-0005)
─ rate-limit          5/min/IP em /auth/login

Integration (~25 testes, Testcontainers Postgres 16-alpine)
─ user.repository, refresh-token.repository, tenant.repository
─ outbox-dispatcher, kms-provider, migrations idempotência

Unit (~40 testes, pure logic)
─ token.service, auth.service (timing defense + theft replay)
─ refresh-rotation, argon2id-params
─ kms-encryption (mocked KMS), permission-mapping cache
─ validation-error.formatter, problem-details.filter, correlation-id ALS
```

### Stack

- **Runner**: Vitest 4.1.6
- **Containers**: `@testcontainers/postgresql@^10`
- **Mocks**: `vitest-mock-extended` para `KmsProvider`
- **NATS mock**: mock da interface `EventPublisher` do `@mais-inclusao/messaging`
- **HTTP**: `@nestjs/testing` + `light-my-request` (Fastify) ou `supertest`
- **Coverage**: thresholds **90/85/90/90**

### Cross-tenant E2E (Camada 6 do ADR-0005)

```typescript
it('admin de tenant A não acessa /users/:id de tenant B → 403 + métrica', async () => {
  const a = await createTenant('a'); const b = await createTenant('b');
  const adminA = await createAdmin(a); const userB = await createUser(b);
  const { access_token } = await login(adminA);
  const res = await request(app).get(`/users/${userB.id}`)
    .set('Authorization', `Bearer ${access_token}`);
  expect(res.status).toBe(403);
  expect(res.body.type).toContain('cross-tenant-access-attempt');
});
```

---

## 9. Estrutura de arquivos

```
apps/auth-service/
├── README.md
├── package.json                @mais-inclusao/auth-service @ 0.1.0, private, type=module
├── tsconfig.json               extends @mais-inclusao/tsconfig/nest.json
├── tsconfig.test.json
├── eslint.config.ts            extends @mais-inclusao/eslint-config/nest
├── vitest.config.ts
├── Dockerfile                  multi-stage (deps + build + slim runtime + tini)
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                 idempotente
│   └── migrations/
│       └── 20260519_001_initial/
│
├── src/
│   ├── main.ts                 NestFactory + FastifyAdapter + ValidationPipe + Pino
│   ├── cli.main.ts             NestCommander entry
│   ├── app.module.ts
│   │
│   ├── shared/
│   │   ├── env/                env.ts (Zod schema) + module + service + token
│   │   ├── pino-logger.module.ts
│   │   ├── problem-details.exception.ts
│   │   ├── problem-details.filter.ts
│   │   ├── throttle.module.ts
│   │   └── validation-error.formatter.ts
│   │
│   ├── context/
│   │   ├── correlation-id.context.ts    AsyncLocalStorage
│   │   ├── correlation-id.interceptor.ts
│   │   └── context.module.ts
│   │
│   ├── prisma/                 PrismaService + Module
│   ├── kms/                    KmsModule + LocalKmsProvider + EncryptionService
│   ├── health/                 HealthController + Module + KmsHealthService
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── token.service.ts
│   │   ├── refresh-token.repository.ts
│   │   ├── dto/                LoginDto, RefreshDto, LogoutDto, AuthTokensDto, MeResponseDto
│   │   ├── decorators/         @Public, @Roles, @CurrentUser
│   │   └── guards/             AuthGuard, RolesGuard
│   │
│   ├── tenant/
│   │   ├── tenant.module.ts
│   │   ├── tenant.controller.ts
│   │   ├── tenant.service.ts
│   │   ├── tenant.repository.ts
│   │   └── dto/                CreateTenantDto, ListTenantsQueryDto, DeactivateTenantDto, TenantDto
│   │
│   ├── user/
│   │   ├── user.module.ts
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── user.repository.ts
│   │   ├── password.service.ts
│   │   └── dto/                CreateUserDto, UpdateUserDto, DeactivateUserDto, UserDto, …
│   │
│   ├── role/
│   │   ├── role.module.ts
│   │   ├── role.controller.ts
│   │   ├── role.service.ts          in-memory cache
│   │   ├── role.repository.ts
│   │   └── dto/                RoleDto, PermissionDto
│   │
│   ├── outbox/
│   │   ├── outbox.module.ts
│   │   ├── outbox.repository.ts     PrismaAuthOutboxStore (OutboxStore adapter)
│   │   └── outbox-dispatcher.service.ts  @Cron
│   │
│   ├── jwks/
│   │   ├── jwks.module.ts
│   │   └── jwks.controller.ts
│   │
│   └── cli/
│       ├── cli.module.ts
│       ├── tenant.command.ts
│       ├── user.command.ts
│       └── bootstrap-token.guard.ts
│
└── test/
    ├── helpers/exec.ts         execa wrappers (sem shell injection)
    ├── unit/                   (~40 testes)
    ├── integration/            (~25 testes Testcontainers)
    └── e2e/                    (~5 testes via Fastify adapter)
```

---

## 10. Dockerfile (multi-stage)

```dockerfile
FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/auth-service/package.json apps/auth-service/
COPY packages/*/package.json packages/*/
RUN pnpm install --frozen-lockfile --filter @mais-inclusao/auth-service...

FROM deps AS build
COPY . .
RUN pnpm --filter @mais-inclusao/auth-service... build

FROM node:24-alpine AS runtime
WORKDIR /app
RUN corepack enable && apk add --no-cache tini
USER node
ENV NODE_ENV=production
COPY --from=build /app/apps/auth-service/dist ./dist
COPY --from=build /app/apps/auth-service/prisma ./prisma
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
EXPOSE 3010
HEALTHCHECK CMD wget -q --spider http://localhost:3010/health/live
ENTRYPOINT ["tini", "--", "node", "dist/main.js"]
```

---

## 11. Env vars

```env
# Server
NODE_ENV=production
PORT=3010
LOG_LEVEL=info

# Postgres
DATABASE_URL=postgresql://user:pass@host:5432/db?schema=auth

# JWT (RS256)
JWT_PRIVATE_KEY_BASE64=<base64 JWK RSA 2048 private>
JWT_PUBLIC_KEY_BASE64=<base64 JWK RSA 2048 public>
JWT_KID=auth-2026-05-key1
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_TTL_SECONDS=604800

# KMS (Onda 1: local mode)
KMS_PROVIDER=local
KMS_MASTER_KEY_BASE64=<base64 32 bytes>
KMS_KID=auth-kms-2026-key1
EMAIL_HASH_PEPPER=<base64 32 bytes — NUNCA rotar sem migration>

# NATS
NATS_URL=nats://localhost:4222
NATS_STREAM=mais-inclusao
OUTBOX_DISPATCH_INTERVAL_MS=2000
OUTBOX_BATCH_SIZE=50

# Bootstrap CLI
BOOTSTRAP_TOKEN_HASH=<argon2id hash do BOOTSTRAP_TOKEN>

# OTel
OTEL_SERVICE_NAME=auth-service
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
```

`src/shared/env/env.ts` valida via Zod schema no boot (não usar class-validator aqui — env é interno ao boot, antes de qualquer NestJS container).

---

## 12. Pré-requisitos (a entregar antes ou junto)

### 12.1 Expansão do `packages/persistence`

Auth-service é o **primeiro consumer** de:

- `KmsProvider` interface (`deriveDek`, `currentKid`)
- Helper `hmacSha256(value, pepper)` para hash determinístico de email
- (decorators `@Encrypted` / `@SearchableHash` podem entrar Onda 2 quando virar codegen)

### 12.2 Uso do `@mais-inclusao/messaging` (sem expansão)

Package já entrega `OutboxDispatcher` engine + `OutboxStore` interface + `EventPublisher` NATS. Auth-service implementa apenas adapter Prisma (`PrismaAuthOutboxStore`) + wrapper `@Cron`.

### 12.3 Infra dev local

`infra/docker/dev/docker-compose.yml` precisa de NATS JetStream + Postgres 16 + Redis. **Já existe** (Onda 1 core).

---

## 13. Definition of Done

- [ ] Lint, typecheck, format check verdes em workspace inteiro
- [ ] 70+ testes verdes (unit + integration + E2E)
- [ ] Coverage ≥ 90% statements / 85% branches / 90% functions / 90% lines no auth-service
- [ ] Migration Prisma initial aplicada limpa em CI fresh DB
- [ ] Seed roda idempotente (sem erro 2 vezes seguidas)
- [ ] Dockerfile builda e sobe → `/health/ready` retorna 200
- [ ] `pnpm cli tenant:create` + `user:create` funcionam end-to-end
- [ ] Cross-tenant E2E test 100% verde (`tenant_id_mismatch_total` permanece 0)
- [ ] JWKS endpoint retorna chave pública válida (testável via `jose`)
- [ ] Refresh token rotation funciona; reuse → revoga família
- [ ] Outbox dispatcher publica eventos em NATS (mock) com Msg-ID correto
- [ ] PII roundtrip: email cifrado em coluna; `email_hash` permite lookup; decrypt retorna original
- [ ] README de `apps/auth-service/` com status, scripts, endpoints, env vars
- [ ] Changeset gerado (auth-service @ 0.2.0; persistence @ 0.3.0)
- [ ] PR mergeado em main + release PR mergeado + tags publicadas

---

## 14. Pendências para Onda 2

- MFA (TOTP via `otplib`)
- SSO / OIDC externo (Gov.br para cidadão; SAML enterprise para gestor)
- Self-service tenant signup
- Citizen identity (vai para `citizen-identity-service`)
- Roles customizadas por tenant (`is_system = false`)
- KMS real (AWS KMS / HashiCorp Vault) substituindo `LocalKmsProvider`
- `@mais-inclusao/audit` package com tabela `audit_log`
- BullMQ + Redis para outbox em volume alto
- PostgreSQL RLS (Camada 4 do ADR-0005)

---

## 15. Referências

- [ADR-0001 — Microsserviços evolutivos por bounded context](../../adr/0001-microsservicos-evolutivos-por-bounded-context.md)
- [ADR-0004 — NATS JetStream + Outbox Pattern](../../adr/0004-nats-jetstream-outbox-pattern.md)
- [ADR-0005 — Multi-tenancy com 6 camadas de defesa em profundidade](../../adr/0005-multi-tenancy-defesa-em-profundidade.md)
- [ADR-0006 — Criptografia de PII em coluna com KEK por tenant](../../adr/0006-criptografia-pii-em-coluna-kek-por-tenant.md)
- [Spec de decomposição — Seção sobre `auth-service`](./2026-05-16-programa-mais-inclusao-decomposicao.md#1-auth-service--identity--tenancy)
- [Contratos auth — events.ts](../../../packages/contracts/src/auth/events.ts)
- [NestJS Fastify migration guide](https://docs.nestjs.com/techniques/performance)
- [class-validator decorators](https://github.com/typestack/class-validator#validation-decorators)
- [OWASP — Argon2id parameters](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#argon2id)
- [RFC 6819 — Threat Model for OAuth 2.0 (token theft replay)](https://datatracker.ietf.org/doc/html/rfc6819)
- [RFC 9457 — Problem Details for HTTP APIs](https://datatracker.ietf.org/doc/html/rfc9457)
- [RFC 7517 — JSON Web Key (JWK)](https://datatracker.ietf.org/doc/html/rfc7517)
