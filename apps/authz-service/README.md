# @mais-inclusao/authz-service

Authorization do +Inclusão (Onda 1) — dono de `Role`, `Permission`, `RolePermission`, `UserRole`.

Spec: [`docs/superpowers/specs/2026-05-20-authz-service-onda-1-design.md`](../../docs/superpowers/specs/2026-05-20-authz-service-onda-1-design.md)
ADR: [`ADR-0011 — Divisão IAM em 3 services`](../../docs/adr/0011-divisao-iam-em-tres-services.md)

## Stack

Idem [tenancy-service](../tenancy-service/README.md#stack), schema PG `authz`.

## Porta: `3020`

## Scripts

Idem [tenancy-service](../tenancy-service/README.md#scripts).

## Endpoints

Ver [spec §2](../../docs/superpowers/specs/2026-05-20-authz-service-onda-1-design.md#2-endpoints-http).

## Eventos consumidos

- `tenancy.user.created` → atribui `UserRole` para cada slug em `payload.roles[]`
- `tenancy.user.deactivated` → seta `revoked_at` em todos `UserRole` ativos do user
- `tenancy.tenant.deactivated` → batch revoke por `tenant_id`

## Eventos publicados

- `authz.user_role.granted`
- `authz.user_role.revoked`

## Endpoints `/internal/*` (HMAC-signed; consumidos por authn-service)

- `GET /internal/users/:userId/roles` — login lookup (retorna `string[]` slugs ativos)
- `GET /internal/users/:userId/permissions` — futuro (Onda 2 quando JWT carregar permissions)

## Seed Prisma (idempotente, dev/CI)

3 roles (`admin`, `gestor`, `triagem`) + 14 permissions + mappings conforme [spec §4](../../docs/superpowers/specs/2026-05-20-authz-service-onda-1-design.md#4-seed-prisma-idempotente-devci).
