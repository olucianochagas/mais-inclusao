# ADR-0005: Multi-tenancy com 6 camadas de defesa em profundidade

- **Status:** accepted
- **Data:** 2026-05-16
- **Decisores:** @olucianochagas
- **Tags:** seguranca, lgpd, multi-tenancy, fundacional

---

## Contexto

O +Inclusão é SaaS multi-tenant que trata dados de **populações vulneráveis** e **dados sensíveis** (Art. 11 LGPD). O **pior bug imaginável** neste produto é **cross-tenant data leak** — um usuário de uma secretaria vendo dados de outra, ou pior, dados de cidadão de outra. Consequências: violação da LGPD (multa de até 2% do faturamento), incidente público com população vulnerável, perda total de credibilidade.

Considerando:

- O modelo escolhido é **discriminator `tenant_id` em toda tabela** (não schema-per-tenant nem DB-per-tenant — operacionalmente sustentável para SaaS comercial).
- Há múltiplos pontos de entrada: REST (BFFs), eventos (NATS), CLI admin, leitura direta de banco (debug).
- Uma única camada falhando deveria **não** comprometer isolamento.

A pergunta: **como tornar cross-tenant leak não apenas improvável, mas estatisticamente impossível através de redundância?**

## Decisão

**Adotar `tenant_id` como discriminator em toda tabela**, com **6 camadas de defesa em profundidade** que detectam ou bloqueiam violações em pontos distintos do stack.

### Camadas

#### 1. JWT carrega `tenant_id` claim

O `auth-service` assina JWT com `tenant_id`, `user_id`, `roles`. Sem claim válido → 401. Refresh token também tenant-scoped (não muda de tenant ao renovar).

#### 2. Nest Guard popula `TenantContext` via AsyncLocalStorage

Guard global valida JWT, extrai `tenant_id`, popula `AsyncLocalStorage` com `{ tenant_id, user_id, roles }`. Todo handler enxerga o contexto sem passar manualmente — eliminando "esqueci de propagar".

#### 3. Repository base filtra `tenant_id` automaticamente

`packages/persistence` exporta `TenantAwareRepository<T>` que injeta `where: { tenant_id }` em toda query Prisma. Casos especiais:

- Query sem contexto = **`MissingTenantContextError`** (exceção runtime, falha alto).
- Tentativa de query explícita com `tenant_id` diferente do contexto = **`CrossTenantAccessAttempt`** (exceção crítica + alerta).

#### 4. PostgreSQL Row Level Security (RLS) — Onda 2

Policy por tabela:

```sql
USING (tenant_id = current_setting('app.current_tenant')::uuid)
```

Connection pool faz `SET LOCAL app.current_tenant = $1` no início de cada request. Mesmo se app esquecer o filtro, banco rejeita. Defesa em profundidade.

#### 5. Eventos carregam `tenant_id` no header obrigatório

Já coberto no [ADR-0004](./0004-nats-jetstream-outbox-pattern.md). Consumer rejeita evento sem header. Cross-tenant via mensageria = impossível por design.

#### 6. Testes E2E de isolamento + métrica de violação

Cada serviço tem suíte que cria 2 tenants, autentica como A, tenta acessar/modificar dado de B — deve **falhar 100% das vezes**. Métrica `tenant_id_mismatch_total` no observability; **alerta crítico se > 0** em produção (não deveria ocorrer nunca).

## Consequências

### Positivas

- **Defesa em profundidade real**: cross-tenant leak exige falha simultânea em múltiplas camadas independentes — estatisticamente improvável se cada camada tem MTTF razoável.
- **Detecção precoce**: métrica `tenant_id_mismatch_total > 0` dispara alerta imediato. Vazamento em produção é tratado antes de virar incidente público.
- **Falhas explícitas e rastreáveis**: exceções `MissingTenantContextError` e `CrossTenantAccessAttempt` vão para log estruturado e disparam alertas — não passam despercebidas.
- **Pressão sobre dev de mau jeito**: contribuidor que tenta "atalho" (bypass do repository) bate na 3ª camada (exceção) e na 4ª camada (RLS em produção). É mais fácil seguir o padrão.
- **Auditoria simplificada**: tenants enterprise pedem evidência de isolamento. Suite de testes E2E + métrica + ROPA + RLS responde quase todas as perguntas de auditoria.

### Negativas

- **Custo de pool de conexão com RLS**: `SET LOCAL` requer conexão session-scoped. Em prod com alta concorrência, exige tunar `max_connections` + PgBouncer com session pooling, não transaction pooling.
- **Performance** de adicionar `WHERE tenant_id = ...` em toda query precisa de **índice em `tenant_id`** em todas as tabelas — sem ele, queries degradam linearmente com volume cross-tenant.
- **Curva de aprendizado**: contribuidores novos precisam entender quando usar `TenantAwareRepository` vs Prisma direto. Tooling de revisão (CODEOWNERS de `packages/persistence`) compensa.
- **Backup/restore por tenant** é complexo (Onda 3) — backup é cross-tenant; extrair/restaurar tenant específico exige scripts especializados.

### Neutras

- **Schema-per-tenant** continua disponível como **opção contratual** para tenants enterprise na Onda 3. Modelo padrão permanece discriminator.

## Alternativas consideradas

### Alternativa A — Schema-per-tenant em PostgreSQL

**Resumo**: Cada tenant tem schema próprio (ex: `tenant_abc.programs`, `tenant_xyz.programs`).

**Por que rejeitada**:

- **Operação de migrations × N tenants** é cara e propensa a erro. Em N=100+ tenants, é pesadelo.
- **Connection pooling** se complica (PgBouncer com search_path dinâmico).
- **Backup/restore granular** é mais fácil — mas inverte o trade-off: ganho operacional limitado para custo operacional alto.
- Mantido como **opção enterprise** na Onda 3, não modelo padrão.

### Alternativa B — DB-per-tenant

**Resumo**: Cada tenant tem banco PostgreSQL próprio.

**Por que rejeitada**:

- **Isolamento físico máximo**, mas custo de infra desproporcional para SaaS.
- Multi-region torna-se inviável em escala.
- Manutenção (versão de PG, backup, monitoring) por banco é proibitivo.

### Alternativa C — Single tenant filter sem RLS

**Resumo**: Apenas `WHERE tenant_id = $1` na aplicação, sem RLS Postgres.

**Por que rejeitada**:

- **Uma única camada de defesa** — se app erra (ex: query SQL crua sem filtro, bug em ORM, migração manual), vazamento silencioso.
- LGPD exige medidas de segurança adequadas — single camada não é defensável em auditoria.

### Alternativa D — Apenas RLS, sem repository base

**Resumo**: Confiar inteiramente no Postgres para isolamento, sem camada de aplicação.

**Por que rejeitada**:

- Erros de aplicação (esquecer `SET LOCAL`, conexão sem contexto) viram falha em runtime confusa.
- Difícil debugar quando "query retorna vazio mas deveria retornar X".
- Sem `MissingTenantContextError` explícito, contribuidor não entende rapidamente o problema.

## Referências

- [Spec de decomposição — Seção 5 (LGPD, multi-tenancy, segurança)](../superpowers/specs/2026-05-16-programa-mais-inclusao-decomposicao.md#seção-5--lgpd-multi-tenancy-segurança-e-acessibilidade)
- [PostgreSQL — Row Security Policies](https://www.postgresql.org/docs/16/ddl-rowsecurity.html)
- [Aaron Brown, "Designing for Tenant Isolation"](https://aws.amazon.com/blogs/apn/saas-tenant-isolation-strategies/) (AWS APN)
- [LGPD Art. 46 e 48 — medidas de segurança e notificação de incidente](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/L13709.htm)
