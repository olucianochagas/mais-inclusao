# @mais-inclusao/contracts

Schemas Zod, eventos e DTOs públicos do monorepo **+Inclusão**. Esta lib é a **fronteira pública** entre serviços — tudo que é publicado/consumido via HTTP ou eventos deve estar aqui.

## Princípios não-negociáveis

1. **Eventos “thin”** — payload contém apenas IDs e fatos essenciais; consumidores fazem lookup autenticado quando necessário.
2. **`tenant_id` obrigatório** em todo evento (defesa cross-tenant em múltiplas camadas).
3. **IDs branded** (ex.: `TenantId`, `UserId`) para evitar confusão entre tipos no compile-time.
4. **Sem PII em eventos** — email, CPF, telefone **nunca** em payload de evento.
5. **SemVer rigoroso** — breaking change = major + Changeset.

## Estrutura

```
src/
  shared/     # tipos universais (EventEnvelope, TenantId, IDs, Pagination, ProblemDetails)
  auth/       # contratos do contexto de autenticação
  index.ts    # re-export flat
```

### Exports

- `@mais-inclusao/contracts` — re-exports principais
- `@mais-inclusao/contracts/shared` — tipos universais
- `@mais-inclusao/contracts/auth` — contratos do contexto auth

Build dual ESM + CJS (com `.d.ts`) — funciona em qualquer ambiente.

## Uso rápido

```ts
import { EventEnvelopeSchema } from '@mais-inclusao/contracts/shared';
import { LoginRequestSchema } from '@mais-inclusao/contracts/auth';
```

## Status atual (Onda 1)

| Contexto | Estado | Conteúdo                                                                                                |
| -------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `shared` | ✅     | `EventEnvelope`, `TenantId`, IDs (`User`/`Program`/`Citizen`/`Application`), Pagination, ProblemDetails |
| `auth`   | ✅     | 4 eventos (`tenant.created`/`deactivated`, `user.created`/`deactivated`) + 5 DTOs HTTP                  |
| Demais   | ⏳     | `programs`, `applications`, `citizens`, `audit`, etc. — adicionados conforme cada serviço evolui        |

## Scripts

| Comando              | O que faz                                          |
| -------------------- | -------------------------------------------------- |
| `pnpm build`         | Gera `dist/` com ESM + CJS + `.d.ts` (tsup + tsc). |
| `pnpm test`          | Vitest run — schemas, validações e snapshots.      |
| `pnpm test:watch`    | Vitest em modo watch.                              |
| `pnpm test:coverage` | Cobertura (thresholds 90/85/90/90).                |
| `pnpm typecheck`     | `tsc --noEmit` em src + test.                      |
| `pnpm lint`          | ESLint flat config.                                |

## Como adicionar um novo contexto

1. Crie `src/<context>/`.
2. Adicione `events.ts` e/ou `http.ts` conforme necessidade.
3. Exporte tudo em `src/<context>/index.ts` e atualize `src/index.ts`.
4. Adicione testes em `test/<context>/` (incluindo snapshot JSON Schema).
5. Abra Changeset (`pnpm changeset`) com bump apropriado.

## Como adicionar um novo evento

1. Crie `XPayloadSchema` (Zod) com apenas IDs + fatos essenciais.
2. Envolva com `EventEnvelopeSchema(XPayloadSchema)`.
3. Adicione testes: casos válidos/ inválidos + snapshot JSON Schema.
4. Atualize `index.ts` do contexto e export raiz.

## Versionamento (SemVer)

| Mudança                                     | Bump  |
| ------------------------------------------- | ----- |
| Adicionar campo **opcional** em DTO/evento  | minor |
| Adicionar novo evento ou DTO                | minor |
| Adicionar novo contexto (`programs/`, etc.) | minor |
| Corrigir validação (sem quebrar contrato)   | patch |
| Adicionar campo **obrigatório**             | major |
| Remover/renomear campo                      | major |

## Snapshots JSON Schema

Os testes geram snapshots via `zod-to-json-schema`. Qualquer mudança de contrato deve atualizar o snapshot e gerar Changeset.

## LGPD e privacidade

Eventos **nunca** devem carregar PII. Toda exceção precisa justificar-se no ROPA e em ADR específico. Ver:

- `docs/legal/ropa.md`
- `docs/adr/0005-multi-tenancy-defesa-em-profundidade.md`

## Naming patterns

- `event_type` sempre no formato `<context>.<entity>.<event>` em `snake_case`.
- Arquivos: `kebab-case.ts`.
- Tipos: `PascalCase`.
