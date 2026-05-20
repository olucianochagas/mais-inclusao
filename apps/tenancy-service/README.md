# @mais-inclusao/tenancy-service

Tenancy do +Inclusão (Onda 1) — dono de `Tenant` e `User` (incluindo PII cifrada e `password_hash`).

Spec: [`docs/superpowers/specs/2026-05-20-tenancy-service-onda-1-design.md`](../../docs/superpowers/specs/2026-05-20-tenancy-service-onda-1-design.md)
ADR: [`ADR-0011 — Divisão IAM em 3 services`](../../docs/adr/0011-divisao-iam-em-tres-services.md)

## Stack

- **NestJS 11** com **`@nestjs/platform-fastify`** (Pino nativo, 2-3x throughput vs Express)
- **Validação HTTP** via **`class-validator` + `class-transformer` + `ValidationPipe` global** (`exceptionFactory` → ProblemDetails RFC 9457)
- **Error envelope**: `ProblemDetailsFilter` global com `Content-Type: application/problem+json`
- **Logger** Pino via `nestjs-pino` com redaction de PII (`@mais-inclusao/observability`)
- **Prisma 6.19** + Postgres 16 (schema `tenancy`)
- **Rate limit** via `@nestjs/throttler` (4 named limits)
- **PII em coluna** via `LocalKmsProvider` (HKDF-SHA256 → AES-256-GCM com auth tag)

## Porta: `3010`

## Scripts

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | tsc watch |
| `pnpm build` | `prisma generate` + `tsc -p tsconfig.json` |
| `pnpm start` | `node dist/main.js` |
| `pnpm cli` | `node dist/cli.main.js` (requer `BOOTSTRAP_TOKEN`) |
| `pnpm test` | Vitest run |
| `pnpm db:migrate:dev` | `prisma migrate dev` |
| `pnpm db:seed` | `prisma db seed` (idempotente) |

## Endpoints

Ver [spec §2](../../docs/superpowers/specs/2026-05-20-tenancy-service-onda-1-design.md#2-endpoints-http).

## Eventos publicados

- `tenancy.tenant.created` — provisionamento
- `tenancy.tenant.deactivated` — soft-delete (authn revoga refresh tokens; authz revoga roles)
- `tenancy.user.created` — payload inclui `roles[]` (authz atribui via consumer)
- `tenancy.user.deactivated` — authn + authz consomem

## Endpoints `/internal/*` (HMAC-signed; consumidos por authn-service)

- `GET /internal/tenants/by-slug?slug=<s>` — login lookup
- `GET /internal/users/lookup?tenant_id=<id>&email_hash=<h>` — login (retorna `password_hash`)
- `GET /internal/users/:id` — `/me` (retorna email decifrado)
- `PATCH /internal/users/:id/last-login` — authn atualiza após login bem-sucedido
