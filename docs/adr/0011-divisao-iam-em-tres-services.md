# ADR-0011: Divisão do IAM em três services (authn / authz / tenancy)

- **Status:** accepted
- **Data:** 2026-05-20
- **Decisores:** @olucianochagas
- **Tags:** auth, microservices, ddd, onda-1
- **Substitui:** decisão de "auth-service unificado" do [spec 2026-05-19-auth-service-onda-1-design.md](../superpowers/specs/2026-05-19-auth-service-onda-1-design.md) (agora SUPERSEDED)

---

## Contexto

O spec original de IAM da Onda 1 propunha um **auth-service unificado** com módulos internos `AuthModule`, `TenantModule`, `UserModule`, `RoleModule` — alinhado ao princípio de "Microservices Evolutivos por Bounded Context" do [ADR-0001](./0001-microsservicos-evolutivos-por-bounded-context.md): começar com bounded contexts agrupados e dividir conforme drivers surgirem (team ownership, performance, lifecycle).

Após brainstorming subsequente, decidimos antecipar a divisão dos sub-bounded contexts do IAM em **três services dedicados na Onda 1**:

- **`tenancy-service`** — donos de `Tenant` e `User` (incluindo `email_encrypted`, `email_hash`, `password_hash`, ciclo `active/deactivated`)
- **`authz-service`** — donos de `Role`, `Permission`, `RolePermission`, `UserRole`; cache in-memory de role→permissions
- **`authn-service`** — donos de `RefreshToken` e session lifecycle; orquestra login + refresh + logout; emite JWT RS256 + serve JWKS

O custo aceito conscientemente: **+3 deploys**, **+3 schemas DB**, **chatty cross-service calls** no `/auth/login` (tenancy lookup → authz lookup → emit JWT), **FKs lógicas em vez de físicas** para `RefreshToken.user_id` / `tenant_id`.

## Decisão

**Adotar 3 services IAM dedicados desde a Onda 1**, com comunicação interna via **HTTP/REST + HMAC-signed headers** (não-NATS) para chamadas síncronas.

### Boundaries por service

| Sub-bounded context | Service     | Porta | Schema PG  | Responsabilidades                                                                                                             |
| ------------------- | ----------- | ----- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Tenancy             | `tenancy-service`  | 3010  | `tenancy`  | CRUD de `Tenant` (admin) + CRUD de `User` (com PII cifrada). Dono do `password_hash` (argon2id). Lifecycle de tenant + user. |
| Authorization       | `authz-service`    | 3020  | `authz`    | Catálogo de `Role`/`Permission` (read-only Onda 1 — `is_system=true`). `UserRole` assignments. Cache role→permissions.       |
| Authentication      | `authn-service`    | 3030  | `authn`    | Login + refresh + logout + `/me` (orquestra). JWT RS256 + JWKS. Refresh tokens com rotação + famílias + theft replay.       |

### Comunicação inter-service

**Síncrona via HTTP/REST interno** (`/internal/*` endpoints, separados dos endpoints públicos):

```
POST /auth/login (authn)
  ↓ GET /internal/tenants/by-slug?slug=...  → tenancy-service
  ↓ GET /internal/users/lookup?tenant_id=...&email_hash=...  → tenancy-service (retorna user + password_hash)
  ↓ argon2.verify(password_hash, password)  (local em authn)
  ↓ GET /internal/users/:userId/roles  → authz-service
  ↓ emit JWT + INSERT auth.refresh_token (local em authn)
```

**Internal API auth**: cada `/internal/*` endpoint verifica `X-Internal-Signature` HMAC-SHA256 de `<method><path><body-sha256><timestamp><nonce>` usando pre-shared key `INTERNAL_SHARED_SECRET` (mesma chave em todos services). Replay defense: `timestamp` ±60s e `nonce` cache TTL 5min.

**Comunicação assíncrona via NATS** entre services:

```
tenancy.tenant.created  → authz-service (no-op em Onda 1; futuro: seed roles padrão)
tenancy.tenant.deactivated → authn-service (revoga refresh tokens do tenant) + authz-service (revoga roles)
tenancy.user.created → authz-service (atribui roles default conforme payload do evento)
tenancy.user.deactivated → authn-service (revoga refresh tokens) + authz-service (revoga roles)
```

Eventos preservam `tenant_id` no header (ADR-0004).

### FKs lógicas em vez de físicas

`authn.refresh_token` tem `user_id` e `tenant_id` como `@db.Uuid` simples (sem `@relation` Prisma), pois não há acesso direto às tabelas do tenancy-service. Consistência via:

- Validação no login (busca do user pelo email_hash já retorna existência)
- Reconciliação por eventos (`tenancy.user.deactivated` → authn revoga refresh tokens)
- Job periódico (Onda 2): batch de check de `user_id`/`tenant_id` órfãos no authn schema

### O que NÃO mudou

- **ADR-0005 (defesa em profundidade)** continua aplicando: cada service valida `tenant_id`, todos eventos carregam header obrigatório.
- **ADR-0006 (criptografia PII com KEK por tenant)** continua aplicando: `tenancy-service` é o ponto de cifragem/decifragem de `email_encrypted`.
- **ADR-0004 (outbox pattern)** continua aplicando: cada service tem sua tabela `outbox_event` no próprio schema.

## Consequências

### Positivas

- **Bounded contexts explícitos** desde o dia 1 — boundary é o deploy boundary.
- **Isolamento de falhas**: authn down não bloqueia operações de admin em tenancy/authz.
- **Extração futura simplificada**: se Onda 2 trouxer SSO Gov.br, a integração entra no authn-service sem tocar tenancy. Se trouxer roles customizadas por tenant, mexe só em authz-service.
- **Schemas DB independentes**: migrations Prisma evoluem por service.

### Negativas

- **Operação 3x**: 3 deploys, 3 monitorings, 3 sets de migrations, 3 healthchecks, 3 contêineres no docker-compose dev.
- **Latência de `/auth/login`**: 2 HTTP calls extras (tenancy + authz) antes de emitir JWT. Mitigação: HTTP interno em rede local (~1-5ms cada); pool de conexões via undici keep-alive.
- **Distributed transactions**: criar User no tenancy + atribuir role default no authz exige saga (eventual consistency via NATS) ou duplo HTTP call. Em Onda 1: tenancy emite `tenancy.user.created` com `roles[]` no payload; authz consome e atribui — eventual.
- **FK lógica em refresh_token**: ferramentas de query (Metabase, etc.) precisam join cross-database; backup/restore por tenant fica complexo (Onda 3).
- **HMAC inter-service**: cada chamada interna paga ~0.1ms de overhead crypto; revisão obrigatória da pre-shared key.

### Neutras

- **Onda 2**: `tenancy-service` ganha self-service signup; `authn-service` ganha SSO/Gov.br/SAML; `authz-service` ganha roles customizadas por tenant. Sem refactoring estrutural — só features.
- **`@mais-inclusao/contracts`** ganha namespaces: `contracts/authn`, `contracts/authz`, `contracts/tenancy`. Schemas Zod de eventos NATS por sub-domínio.

## Alternativas consideradas

### Alternativa A — auth-service unificado (caminho original)

**Resumo**: 1 service com módulos internos `Tenant`, `User`, `Role`, `Auth`.

**Por que rejeitada**: foi a recomendação técnica baseada no ADR-0001 e em pragmatismo. Override explícito do BDFL: adotar separação desde a Onda 1 para evitar refactoring estrutural quando os drivers surgirem (SSO, team ownership futura, scaling distinto entre login flow vs admin operations). Aceita o custo de overhead operacional na fase inicial.

### Alternativa B — Comunicação inter-service via NATS request-reply

**Resumo**: authn → publish `tenancy.user.lookup.req` → tenancy responde.

**Por que rejeitada**: mistura messaging com sync RPC (antipattern). NATS request-reply tem timeout default 1s e perde graceful retry com backoff. Debug fica difícil (sem stacktrace HTTP). HTTP/REST tem ferramental melhor (Postman, curl, dashboard de errors).

### Alternativa C — gRPC com proto contracts

**Resumo**: define `.proto` files compartilhados, codegen de clients tipados.

**Por que rejeitada**: Onda 1 ainda é baixo volume (alguns RPS), ganho marginal de performance vs HTTP/REST. Custo de tooling extra (buf, protoc-gen-ts) sem benefício claro nesta fase. Pode migrar em Onda 2 se houver dor real de latência.

### Alternativa D — Shared library + direct DB access

**Resumo**: cada service lê o DB do outro.

**Por que rejeitada**: anula a divisão (coupling forte por schema). Quebra ADR-0005 (cada service tem seu próprio schema). Anti-padrão clássico de "distributed monolith".

## Referências

- [ADR-0001 — Microsserviços evolutivos por bounded context](./0001-microsservicos-evolutivos-por-bounded-context.md)
- [ADR-0004 — NATS JetStream + Outbox Pattern](./0004-nats-jetstream-outbox-pattern.md)
- [ADR-0005 — Multi-tenancy com 6 camadas de defesa em profundidade](./0005-multi-tenancy-defesa-em-profundidade.md)
- [ADR-0006 — Criptografia de PII em coluna com KEK por tenant](./0006-criptografia-pii-em-coluna-kek-por-tenant.md)
- [Spec original (SUPERSEDED) — auth-service unificado](../superpowers/specs/2026-05-19-auth-service-onda-1-design.md)
- [Spec tenancy-service Onda 1](../superpowers/specs/2026-05-20-tenancy-service-onda-1-design.md)
- [Spec authz-service Onda 1](../superpowers/specs/2026-05-20-authz-service-onda-1-design.md)
- [Spec authn-service Onda 1](../superpowers/specs/2026-05-20-authn-service-onda-1-design.md)
- [Phil Calçado — "Pattern: Backends For Frontends"](https://www.philcalcado.com/2017/08/03/pattern_backends_for_frontends.html) sobre evitar distributed monolith
- [Sam Newman — Monolith to Microservices, capítulo 2](https://samnewman.io/books/monolith-to-microservices/) sobre quando dividir
