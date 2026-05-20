# Design: `authn-service` (Onda 1)

- **Data**: 2026-05-20
- **Status**: aprovado em brainstorming, pronto para implementação
- **Owner**: @olucianochagas
- **Tags**: authentication, jwt, refresh, jwks, onda-1
- **Contexto**: 1 de 3 specs do IAM Onda 1 (ver [ADR-0011](../../adr/0011-divisao-iam-em-tres-services.md))

---

## 1. Visão geral

Service responsável pelo **session lifecycle**: login, refresh com rotação + famílias + theft replay defense, logout, emissão de JWT RS256, JWKS público. **Orquestra** consultas síncronas a `tenancy-service` (validar tenant + buscar user/password_hash) e `authz-service` (resolver roles) — não armazena passwords nem catálogo de permissions.

- **Porta**: `3030` · **Schema PG**: `authn` · **Path**: `apps/authn-service/`
- **HTTP adapter**: `@nestjs/platform-fastify` · **Validation**: class-validator
- **JWT**: RS256 com chave privada local; chave pública servida em `/.well-known/jwks.json` (cache 10min)
- **Refresh tokens**: stateful em `authn.refresh_token` com `family_id` + `rotated_to` + `used_at` (theft replay detection)
- **Argon2id** local: para `passwordService.verifyAgainstDummy()` (timing-attack defense em login com user inexistente). O `argon2.verify` real usa hash retornado pelo tenancy-service.
- **Eventos publicados** (NATS via outbox):
  - `authn.session.opened` — login bem-sucedido (Onda 2: passa para audit)
  - `authn.session.revoked` — logout ou token theft replay
- **Eventos consumidos**:
  - `tenancy.user.deactivated` → revoga todos refresh tokens do user
  - `tenancy.tenant.deactivated` → revoga todos refresh tokens do tenant
- **Consome** (HTTP interno, HMAC-signed):
  - tenancy-service: `GET /internal/tenants/by-slug`, `GET /internal/users/lookup`, `GET /internal/users/:id`
  - authz-service: `GET /internal/users/:userId/roles`

## 2. Endpoints HTTP

### Públicos (`@Public()`)

| Method | Path                      | Body / Query     | Response                     | Throttle      |
| ------ | ------------------------- | ---------------- | ---------------------------- | ------------- |
| `GET`  | `/.well-known/jwks.json`  | —                | RFC 7517 JWKS                | 1000/min      |
| `GET`  | `/health/live`            | —                | `200 OK`                     | unlimited     |
| `GET`  | `/health/ready`           | —                | `200 OK` (DB + tenancy + authz HTTP reachable) | unlimited |
| `POST` | `/auth/login`             | `LoginDto`       | `AuthTokensDto`              | **5/min/IP**  |
| `POST` | `/auth/refresh`           | `RefreshDto`     | `AuthTokensDto`              | **60/min/IP** |

### Autenticados (JWT do próprio authn)

| Method | Path             | Body            | Response             |
| ------ | ---------------- | --------------- | -------------------- |
| `GET`  | `/me`            | —               | `MeResponseDto`      |
| `POST` | `/auth/logout`   | `LogoutDto`     | `204`                |

`MeResponseDto` é orquestrado: authn consulta tenancy (`/internal/users/:id` retorna user+tenant) e authz (`/internal/users/:id/roles`) — retorna `{ user, tenant, roles }`.

## 3. Schema Prisma (`schema=authn`)

```prisma
model RefreshToken {
  id        String @id @default(uuid()) @db.Uuid
  family_id String @db.Uuid

  // FKs lógicas (sem @relation) para tenancy.user.id / tenancy.tenant.id
  user_id   String @db.Uuid
  tenant_id String @db.Uuid

  token_hash String   @unique @db.Char(64)  // SHA-256 hex do token raw
  expires_at DateTime
  created_at DateTime  @default(now())
  used_at    DateTime?
  rotated_to String?   @db.Uuid

  revoked_at     DateTime?
  revoked_reason RevokeReason?

  @@index([family_id])
  @@index([user_id, expires_at])
  @@index([tenant_id])
  @@schema("authn")
}

enum RevokeReason { logout user_deactivated tenant_deactivated reused token_theft_replay  @@schema("authn") }

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
  @@schema("authn")
}
```

## 4. Fluxo de login (com 2 hops internos)

```
POST /auth/login { tenant_slug, email, password }
  │
  ├─ ValidationPipe (LoginDto: email@max254, password@12-256, slug@min1max64) → 422 se falha
  ├─ ThrottlerGuard 5/min/IP → 429 se excede
  │
  ├─ tenancyClient.findTenantBySlug(slug)   ← HTTP interno (HMAC)
  │    ↳ se null → passwordService.verifyAgainstDummy(password) + 401 (timing defense)
  │    ↳ se status='deactivated' → idem + 401
  │
  ├─ emailHash = HMAC-SHA256(normalize(email), EMAIL_HASH_PEPPER)
  │
  ├─ tenancyClient.lookupUser(tenant_id, emailHash)  ← HTTP interno (HMAC)
  │    ↳ se null → passwordService.verifyAgainstDummy(password) + 401
  │
  ├─ argon2.verify(user.password_hash, password)  → 401 se mismatch
  ├─ if user.status !== 'active' → 401
  │
  ├─ authzClient.getUserRoles(user.id)   ← HTTP interno (HMAC)
  │    ↳ retorna ['admin', 'gestor', ...]
  │
  ├─ accessToken = TokenService.signAccess({user_id, tenant_id, roles}, 15min)
  ├─ refreshTokenRaw = randomBytes(32).toString('base64url')
  ├─ tokenHash = SHA-256(refreshTokenRaw)
  ├─ INSERT authn.refresh_token (family_id=new uuid, token_hash, expires_at +7d)
  │
  ├─ PATCH /internal/users/:id/last-login  ← HTTP interno tenancy
  ├─ outboxEvent.create('authn.session.opened', { user_id, tenant_id, ... })
  └─ 200 { access_token, refresh_token: raw, expires_in: 900, token_type: 'Bearer' }
```

## 5. Fluxo de refresh (rotação + theft replay)

```
POST /auth/refresh { refresh_token: raw }
  │
  ├─ tokenHash = SHA-256(raw)
  ├─ row = refreshTokenRepo.findByHash(tokenHash) → 401 se null
  ├─ if row.revoked_at IS NOT NULL → 401 + audit
  ├─ if row.expires_at < now() → 401
  │
  ├─ if row.used_at IS NOT NULL → TOKEN THEFT REPLAY:
  │    ├─ refreshTokenRepo.revokeFamily(row.family_id, 'token_theft_replay')
  │    ├─ Pino audit ERROR + metric `auth_token_theft_total++`
  │    ├─ outboxEvent.create('authn.session.revoked', { reason: 'token_theft_replay', family_id })
  │    └─ 401 (cliente legítimo perde sessão; atacante perde acesso)
  │
  ├─ tenancyClient.getUserById(row.user_id)  ← HTTP interno
  │    ↳ if status !== 'active' → 401
  │
  ├─ authzClient.getUserRoles(row.user_id)   ← HTTP interno
  │
  ├─ newAccess = TokenService.signAccess(...)
  ├─ newRefresh = TokenService.createRefresh(...)
  ├─ TX BEGIN:
  │     INSERT new RefreshToken (mesma family_id, novo token_hash)
  │     UPDATE row SET used_at=now(), rotated_to=newRefresh.id
  │   COMMIT
  │
  └─ 200 AuthTokensDto
```

## 6. Internal HTTP client (typed wrappers em `apps/authn-service/src/internal-clients/`)

```typescript
// tenancy.client.ts
@Injectable()
export class TenancyClient {
  async findTenantBySlug(slug: string): Promise<TenantLookupDto | null>
  async lookupUser(tenant_id: string, email_hash: string): Promise<UserLookupDto | null>
  async getUserById(id: string): Promise<UserViewDto | null>
  async updateLastLogin(id: string): Promise<void>
}

// authz.client.ts
@Injectable()
export class AuthzClient {
  async getUserRoles(user_id: string): Promise<string[]>
}
```

Cada chamada injeta header `X-Internal-Signature` HMAC-SHA256 de `<METHOD><PATH><BODY-SHA256><TIMESTAMP><NONCE>` usando `INTERNAL_SHARED_SECRET`. Replay defense: ±60s timestamp, nonce LRU cache 5min no receiver.

## 7. Definition of Done

- [ ] JWKS endpoint retorna chave pública válida (testável via `jose`)
- [ ] Login flow E2E: ValidationPipe + Throttler + 2 HTTP internos + JWT emitido + refresh INSERT
- [ ] Refresh rotation funciona; reuse → revoga família
- [ ] Theft replay E2E: usar refresh já rotacionado → família revogada + audit log + 401
- [ ] Cross-tenant E2E (Camada 6 ADR-0005): JWT do tenant A → não acessa `/me` que orquestra dados de B
- [ ] NATS consumers funcionam: `tenancy.user.deactivated` revoga refresh tokens
- [ ] Internal HTTP HMAC validation funciona (replay + bad timestamp → 401)
- [ ] Migration Prisma initial aplicada limpa
- [ ] 25+ tests verdes (unit + integration + E2E)
- [ ] Coverage ≥ 90/85/90/90
- [ ] Dockerfile + health/ready OK (verifica DB + tenancy reachable + authz reachable)

## 8. Pendências Onda 2

- MFA (TOTP via `otplib`)
- SSO/OIDC externo (Gov.br para cidadão; SAML para gestor enterprise)
- Rotação automática de RSA keys via Vault
- Session management UI (listar sessões ativas, kill remoto)
- BullMQ + Redis para outbox em volume alto
