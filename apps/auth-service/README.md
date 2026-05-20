# @mais-inclusao/auth-service

Identidade + tenancy + RBAC do +Inclusão (Onda 1).

Spec: [`docs/superpowers/specs/2026-05-19-auth-service-onda-1-design.md`](../../docs/superpowers/specs/2026-05-19-auth-service-onda-1-design.md)

## Stack

- **NestJS 11** com **`@nestjs/platform-fastify`** (Pino nativo do Fastify; 2-3x throughput vs Express).
- **Validação HTTP** via **`class-validator` + `class-transformer` + `ValidationPipe` global** (padrão oficial NestJS); `exceptionFactory` retorna ProblemDetails RFC 9457 (status 422).
- **Error envelope**: `ProblemDetailsFilter` global com `Content-Type: application/problem+json`.
- **Logger** Pino via `nestjs-pino`, com redaction de PII (`@mais-inclusao/observability`).
- **Prisma 6.19** + Postgres 16 (schema `auth`).
- **Rate limit** via `@nestjs/throttler` (4 named limits: default/auth-login/auth-refresh/jwks).
- **PII em coluna** via `LocalKmsProvider` (HKDF-SHA256 → AES-256-GCM com auth tag).
- **Testing**: Vitest + Testcontainers (Postgres 16-alpine).

## Status (scaffold inicial)

| Capacidade | Estado |
| --- | --- |
| Env Zod + validação no boot | ✅ |
| ProblemDetailsFilter global | ✅ |
| ValidationPipe global com class-validator | ✅ (em main.ts) |
| Pino logger via nestjs-pino | ✅ |
| Correlation-id ALS + interceptor | ✅ |
| ThrottleModule com 4 limits | ✅ |
| Prisma schema (8 tabelas + 6 enums) | ✅ |
| LocalKmsProvider (HKDF + AES-256-GCM) | ✅ |
| Health (/live, /ready) | ✅ |
| JWKS endpoint | ⏳ |
| AuthModule (login/refresh/logout/me) | ⏳ |
| RoleModule (read-only catalog) | ⏳ |
| TenantModule (CRUD admin) | ⏳ |
| UserModule (CRUD com encryption) | ⏳ |
| OutboxDispatcher (@Cron) | ⏳ |
| CLI bootstrap | ⏳ |

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

## Env vars

Ver [spec §11](../../docs/superpowers/specs/2026-05-19-auth-service-onda-1-design.md#11-env-vars).

## Endpoints

Ver [spec §5](../../docs/superpowers/specs/2026-05-19-auth-service-onda-1-design.md#5-endpoints-http).

## Decisões arquiteturais

Ver [spec §2](../../docs/superpowers/specs/2026-05-19-auth-service-onda-1-design.md#2-decisões-arquiteturais).
