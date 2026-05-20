# @mais-inclusao/authn-service

Authentication do +Inclusão (Onda 1) — login, refresh com famílias + theft replay, JWT RS256, JWKS endpoint.

Spec: [`docs/superpowers/specs/2026-05-20-authn-service-onda-1-design.md`](../../docs/superpowers/specs/2026-05-20-authn-service-onda-1-design.md)
ADR: [`ADR-0011 — Divisão IAM em 3 services`](../../docs/adr/0011-divisao-iam-em-tres-services.md)

## Stack

Idem [tenancy-service](../tenancy-service/README.md#stack), schema PG `authn`.

Adicionalmente: **clients HTTP internos** para `tenancy-service` e `authz-service` (HMAC-signed via `INTERNAL_SHARED_SECRET`).

## Porta: `3030`

## Scripts

Idem [tenancy-service](../tenancy-service/README.md#scripts), exceto que **não tem CLI** (provisionamento é responsabilidade do tenancy-service).

## Endpoints

Ver [spec §2](../../docs/superpowers/specs/2026-05-20-authn-service-onda-1-design.md#2-endpoints-http).

## Fluxos críticos

- **Login**: ValidationPipe → Throttler 5/min → 2 HTTP internos (tenancy lookup + authz roles) → argon2 verify → emit JWT + INSERT refresh_token (Ver [spec §4](../../docs/superpowers/specs/2026-05-20-authn-service-onda-1-design.md#4-fluxo-de-login-com-2-hops-internos))
- **Refresh + theft replay**: rotação obrigatória; reuse → revoga família + emit `authn.session.revoked` (Ver [spec §5](../../docs/superpowers/specs/2026-05-20-authn-service-onda-1-design.md#5-fluxo-de-refresh-rotação--theft-replay))

## Eventos consumidos

- `tenancy.user.deactivated` → revoga todos refresh tokens do user
- `tenancy.tenant.deactivated` → revoga todos refresh tokens do tenant

## Eventos publicados

- `authn.session.opened`
- `authn.session.revoked`

## JWKS

Endpoint público `/.well-known/jwks.json` (throttle 1000/min) com chave pública RS256 conforme RFC 7517. Cache TTL 10min recomendado para consumers.
