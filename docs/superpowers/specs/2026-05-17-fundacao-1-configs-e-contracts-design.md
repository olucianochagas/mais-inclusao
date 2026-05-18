# Fundação 1 — Configs compartilhadas + `packages/contracts` core

|                      |                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data**             | 2026-05-17                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Autor**            | Luciano Douglas Machado Chagas <olucianochagas@gmail.com>                                                                                                                                                                                                                                                                                                                                                     |
| **Status**           | Design aprovado em brainstorming. Aguarda revisão final do doc e transição para `writing-plans`.                                                                                                                                                                                                                                                                                                              |
| **Tipo**             | Spec de subprojeto da **Onda 1** (primeiro ciclo de implementação).                                                                                                                                                                                                                                                                                                                                           |
| **Onda**             | 1 (MVP)                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Pré-requisitos**   | Bootstrap do monorepo concluído (32 commits, configurações raiz, workflows GitHub Actions).                                                                                                                                                                                                                                                                                                                   |
| **Spec mestra**      | [`2026-05-16-programa-mais-inclusao-decomposicao.md`](./2026-05-16-programa-mais-inclusao-decomposicao.md)                                                                                                                                                                                                                                                                                                    |
| **ADRs relevantes**  | [ADR-0001](../../adr/0001-microsservicos-evolutivos-por-bounded-context.md) · [ADR-0003](../../adr/0003-monorepo-turborepo-pnpm.md) · [ADR-0004](../../adr/0004-nats-jetstream-outbox-pattern.md) · [ADR-0005](../../adr/0005-multi-tenancy-defesa-em-profundidade.md) · [ADR-0007](../../adr/0007-wcag-22-aa-como-definition-of-done.md) · [ADR-0008](../../adr/0008-conventional-commits-dco-changesets.md) |
| **Próximo artefato** | Plano de implementação via `writing-plans`.                                                                                                                                                                                                                                                                                                                                                                   |

---

## Sumário

1. [Sumário executivo](#sumário-executivo)
2. [Por que este subprojeto primeiro](#por-que-este-subprojeto-primeiro)
3. [Decisões fechadas no brainstorming](#decisões-fechadas-no-brainstorming)
4. [Seção 1 — Visão geral e dependências entre os packages](#seção-1--visão-geral-e-dependências-entre-os-packages)
5. [Seção 2 — `packages/tsconfig`](#seção-2--packagestsconfig)
6. [Seção 3 — `packages/eslint-config`](#seção-3--packageseslint-config)
7. [Seção 4 — `packages/contracts`](#seção-4--packagescontracts)
8. [Seção 5 — Build, publicação, testes e CI](#seção-5--build-publicação-testes-e-ci)
9. [Definition of Done](#definition-of-done)
10. [Riscos e mitigações](#riscos-e-mitigações)
11. [O que NÃO está no escopo](#o-que-não-está-no-escopo)
12. [Apêndices](#apêndices)

---

## Sumário executivo

Este subprojeto entrega **3 packages internos do monorepo +Inclusão**, formando a fundação técnica antes de qualquer serviço ou app:

1. **`@mais-inclusao/tsconfig`** — 5 variantes de `tsconfig.json` (`base`, `nest`, `react`, `lib`, `test`) consumidas por todos os workspaces futuros.
2. **`@mais-inclusao/eslint-config`** — ESLint 9 flat config com 3 presets (`nest`, `react`, `lib`), regras de segurança (`eslint-plugin-security`), acessibilidade (`jsx-a11y` em `strict`), e padrão de importação.
3. **`@mais-inclusao/contracts`** — fronteira pública entre serviços. `EventEnvelope` com Zod, tipos compartilhados (`TenantId` branded, `Pagination`, `ProblemDetails` RFC 9457, IDs branded), e os primeiros schemas do domínio **auth** (4 eventos + 5 DTOs HTTP). Build via tsup em ESM+CJS+`.d.ts`; testes Vitest com snapshots JSON Schema como golden master contra breaking changes acidentais.

**Resultado tangível ao final**: `pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build` passa local e no CI; cada package tem `README.md` consumível; outros workspaces (a partir do próximo ciclo) podem importar contratos prontos sem reinventar `EventEnvelope`, `TenantContext`, etc.

---

## Por que este subprojeto primeiro

O Apêndice D da [spec mestra](./2026-05-16-programa-mais-inclusao-decomposicao.md) já documenta esta escolha. Pontos centrais:

- **`packages/contracts` é o ponto mais sensível identificado em [ADR-0001](../../adr/0001-microsservicos-evolutivos-por-bounded-context.md)** (linha amarela do grafo de dependências). Quando o `auth-service` nascer no próximo ciclo, ele consome contratos prontos — não inventa `EventEnvelope`, headers, padrões de erro ad-hoc.
- **`tsconfig` e `eslint-config` são pré-requisitos universais** de qualquer workspace. Sem eles padronizados no dia 0, cada package subsequente inventa configurações locais que divergem.
- **Não exige Postgres, Redis, NATS rodando** — testes Vitest puros + snapshots JSON Schema cobrem 90%+. Permite valor de ponta a ponta (incluindo CI verde) **antes** de qualquer container ser introduzido.
- **`tailwind-config`, `persistence`, `messaging`, `audit`, `observability`, `testing`** ficam para ciclos posteriores, cada um com seu próprio gatilho (`tailwind-config` entra quando `packages/ui` nascer; `persistence` quando primeiro serviço com Prisma nascer; etc.).

---

## Decisões fechadas no brainstorming

| Pergunta                                     | Resposta                                              | Implicação                                                                                                      |
| -------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Q1**: Escopo dos packages de configuração? | Só `tsconfig` + `eslint-config`.                      | `tailwind-config` fica para a fatia da UI. YAGNI rigoroso.                                                      |
| **Q2**: Quanto de `packages/contracts`?      | Shared + auth events + auth DTOs HTTP mínimos.        | 4 eventos auth + 5 DTOs HTTP definidos; demais (Tenants CRUD, Users CRUD) ficam para o ciclo do `auth-service`. |
| **Q3**: Estratégia de testes?                | Vitest unit + snapshots JSON Schema.                  | `zod-to-json-schema` gera schema → snapshot versionado em git. Mudança não-intencional quebra CI.               |
| **Q4**: Postura de publicação?               | Privado com `publishConfig` pronto.                   | `"private": true` bloqueia npm publish acidental; `publishConfig` deixa pronto para abrir publicação no futuro. |
| **Abordagem de execução**                    | α — Estrutura completa, qualidade alta desde o dia 0. | ~3-5 dias de scaffolding com pattern bem estabelecido para próximos packages copiarem.                          |

---

## Seção 1 — Visão geral e dependências entre os packages

### Estrutura no monorepo

```
packages/
├── tsconfig/                       # @mais-inclusao/tsconfig
│   ├── package.json                # private, exports map, files allowlist
│   ├── README.md
│   ├── base.json                   # strict + extras (migrado de tsconfig.base.json raiz)
│   ├── nest.json                   # extends base; decorators, CJS-friendly
│   ├── react.json                  # extends base; jsx react-jsx, DOM
│   ├── lib.json                    # extends base; declaration true, composite true
│   ├── test.json                   # extends base; vitest globals, relaxado
│   └── tsconfig.json               # self-typecheck
│
├── eslint-config/                  # @mais-inclusao/eslint-config
│   ├── package.json                # type: module, exports nested
│   ├── README.md
│   ├── src/
│   │   ├── index.js                # base (TS strict + import + security)
│   │   ├── nest.js                 # base + decorators-friendly
│   │   ├── react.js                # base + react + jsx-a11y strict
│   │   └── lib.js                  # base + regras strict para library
│   ├── tsconfig.json
│   └── eslint.config.js
│
└── contracts/                      # @mais-inclusao/contracts
    ├── package.json                # type: module, exports map nested, dist via tsup
    ├── README.md                   # padrões + versionamento + exemplos
    ├── src/
    │   ├── shared/
    │   │   ├── event-envelope.ts   # EventHeadersSchema, EventEnvelopeSchema<T>
    │   │   ├── pagination.ts       # PaginationQuery, PaginatedResult<T>
    │   │   ├── error.ts            # ProblemDetails RFC 9457
    │   │   ├── tenant.ts           # TenantIdSchema branded, TenantClaim
    │   │   ├── ids.ts              # UserId, ProgramId, CitizenId, ApplicationId
    │   │   └── index.ts
    │   ├── auth/
    │   │   ├── http.ts             # LoginRequest/Response, RefreshRequest/Response, MeResponse
    │   │   ├── events.ts           # 4 eventos auth.tenant.* + auth.user.*
    │   │   └── index.ts
    │   └── index.ts                # re-export flat
    ├── test/                       # paralelo a src/
    ├── __snapshots__/              # JSON Schemas golden master
    ├── eslint.config.js
    ├── tsconfig.json               # extends @mais-inclusao/tsconfig/lib.json
    ├── tsconfig.test.json          # extends @mais-inclusao/tsconfig/test.json
    ├── tsup.config.ts
    └── vitest.config.ts
```

### Grafo de dependência entre os packages

```mermaid
flowchart LR
    TSC["@mais-inclusao/tsconfig<br/>(JSON estático)"]
    ESL["@mais-inclusao/eslint-config<br/>(JS flat configs)"]
    CON["@mais-inclusao/contracts<br/>(TypeScript + Zod)"]

    TSC --> ESL
    TSC --> CON
    ESL --> CON

    classDef pkg fill:#3a2a18,stroke:#d0a86b,color:#fff
    class TSC,ESL,CON pkg
```

A ordem importa para build/instalação. O pnpm com workspaces resolve via symlinks; Turborepo orquestra `build → ^build` corretamente.

### Forma de exportação por package

| Package         | Forma                                      | Como consumer usa                                                       |
| --------------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| `tsconfig`      | Arquivos JSON via `files` + `exports` map  | `"extends": "@mais-inclusao/tsconfig/nest.json"`                        |
| `eslint-config` | JS presets (flat config) via `exports`     | `import nest from '@mais-inclusao/eslint-config/nest'`                  |
| `contracts`     | TS compilado para ESM+CJS+`.d.ts` via tsup | `import { EventEnvelopeSchema } from '@mais-inclusao/contracts/shared'` |

### Migração do `tsconfig.base.json` raiz

O `tsconfig.base.json` que já está commitado na raiz **migra** para `packages/tsconfig/base.json` em **2 commits separados**:

1. Criar `packages/tsconfig/base.json` com conteúdo idêntico (cópia inicial).
2. Substituir conteúdo do `tsconfig.base.json` raiz por `"extends": "@mais-inclusao/tsconfig/base.json"` (preserva project references).

Isso permite `git log --follow tsconfig.base.json` rastrear evolução sem perda de história.

---

## Seção 2 — `packages/tsconfig`

### Variantes

| Variante     | Para                 | Adições/overrides sobre `base`                                                                                                                  |
| ------------ | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `base.json`  | Comum a todos        | Strict + 5 extras, ES2023, Bundler resolution, isolatedModules, verbatimModuleSyntax, incremental                                               |
| `nest.json`  | Apps backend NestJS  | `experimentalDecorators`, `emitDecoratorMetadata`, `useDefineForClassFields: false`, `types: ["node"]`, `module: NodeNext`, `composite: true`   |
| `react.json` | Apps frontend MF     | `jsx: react-jsx`, `lib: ["ES2023", "DOM", "DOM.Iterable"]`, `types: ["vite/client", "@module-federation/enhanced/runtime"]`, `composite: false` |
| `lib.json`   | Packages publicáveis | `declaration: true`, `declarationMap: true`, `sourceMap: true`, `composite: true`, `stripInternal: true`                                        |
| `test.json`  | Arquivos `*.test.ts` | `types: ["node", "vitest/globals"]`, `noUnusedLocals: false`, `isolatedModules: false`                                                          |

### `package.json`

```jsonc
{
  "name": "@mais-inclusao/tsconfig",
  "version": "0.1.0",
  "private": true,
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org",
    "provenance": true,
  },
  "type": "commonjs",
  "exports": {
    "./base.json": "./base.json",
    "./nest.json": "./nest.json",
    "./react.json": "./react.json",
    "./lib.json": "./lib.json",
    "./test.json": "./test.json",
  },
  "files": ["*.json", "README.md"],
}
```

Sem `scripts`, sem `dependencies`. JSONs distribuídos diretamente.

### Exemplos de consumo

**Em `apps/auth-service/tsconfig.json`** (vir em ciclos posteriores):

```jsonc
{
  "extends": "@mais-inclusao/tsconfig/nest.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src" },
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts", "test/**"],
}
```

**Em `apps/cidadao-mf/tsconfig.json`**:

```jsonc
{
  "extends": "@mais-inclusao/tsconfig/react.json",
  "compilerOptions": { "outDir": "./dist" },
  "include": ["src/**/*"],
}
```

### README — conteúdo obrigatório

- O que é (configurações TS compartilhadas).
- Tabela de decisão de qual variante usar.
- 3 exemplos de consumo completos (NestJS, React, library).
- Explicação de `noUncheckedIndexedAccess` no contexto LGPD (link ADR-0006).
- Regra prática: se ≥ 2 workspaces precisam da mesma config, vira variante.

---

## Seção 3 — `packages/eslint-config`

### Presets exportados

| Preset                | Para                    | Base + adições                                                                                                                                                                                         |
| --------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/index.js` (base) | Reusado pelos 3 presets | typescript-eslint strict + import + simple-import-sort + security; regras críticas: `no-floating-promises`, `consistent-type-imports`, `switch-exhaustiveness-check`, `no-console` (exceto warn/error) |
| `src/nest.js`         | Backend NestJS          | Base + node globals; desabilita `no-extraneous-class`, `parameter-properties`; **`no-restricted-imports` bloqueia `PrismaClient` direto** (força uso de `TenantAwareRepository`)                       |
| `src/react.js`        | Frontend MF             | Base + react + react-hooks + **jsx-a11y `strict`** (alinhado ADR-0007); `no-autofocus` strict; `label-has-associated-control` rigoroso                                                                 |
| `src/lib.js`          | Packages publicáveis    | Base + `explicit-function-return-type`, `explicit-module-boundary-types`, `no-default-export`, `no-internal-modules`                                                                                   |

### `package.json`

```jsonc
{
  "name": "@mais-inclusao/eslint-config",
  "version": "0.1.0",
  "private": true,
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org",
    "provenance": true,
  },
  "type": "module",
  "exports": {
    ".": "./src/index.js",
    "./nest": "./src/nest.js",
    "./react": "./src/react.js",
    "./lib": "./src/lib.js",
  },
  "files": ["src", "README.md"],
  "peerDependencies": { "eslint": "catalog:", "typescript": "catalog:" },
  "dependencies": {
    "@eslint/js": "^9.16.0",
    "typescript-eslint": "catalog:",
    "eslint-plugin-import": "catalog:",
    "eslint-plugin-simple-import-sort": "catalog:",
    "eslint-plugin-security": "catalog:",
    "eslint-plugin-react": "catalog:",
    "eslint-plugin-react-hooks": "catalog:",
    "eslint-plugin-jsx-a11y": "catalog:",
    "globals": "^15.13.0",
  },
}
```

### Exemplos de consumo

**`apps/auth-service/eslint.config.js`**:

```javascript
import nestConfig from '@mais-inclusao/eslint-config/nest';
export default [...nestConfig, { ignores: ['dist/**', '**/*.generated.ts'] }];
```

**`apps/cidadao-mf/eslint.config.js`**:

```javascript
import reactConfig from '@mais-inclusao/eslint-config/react';
export default [...reactConfig, { ignores: ['dist/**', '.rspack/**'] }];
```

**`packages/contracts/eslint.config.js`**:

```javascript
import libConfig from '@mais-inclusao/eslint-config/lib';
export default [...libConfig, { ignores: ['dist/**'] }];
```

### README — conteúdo obrigatório

- Filosofia: ESLint 9 flat config. Zero `.eslintrc` legacy.
- Tabela de decisão de qual preset usar.
- 3 exemplos de consumo (NestJS, React, library).
- Como overridar regras sem brigar com preset.
- Nota sobre `parserOptions.projectService` (type-aware lint, performance).
- Nota sobre `jsx-a11y strict` (não recommended), alinhado com ADR-0007.
- Lista das rules `security/*` críticas e raciocínio.
- Como propor nova rule (PR com justificativa, abrange ≥ 2 workspaces).

---

## Seção 4 — `packages/contracts`

### Princípios não-negociáveis

1. **Thin events** — payload com apenas IDs + o que mudou. Consumer faz lookup se precisar.
2. **`tenant_id` obrigatório** em todo evento (defesa cross-tenant via header).
3. **Branded IDs** evitam confusão entre `UserId`, `TenantId`, `ProgramId`, etc.
4. **Sem PII em payload de evento** — emails, CPFs e similares ficam acessíveis via lookup autenticado, nunca em fila.
5. **Versionamento SemVer** — quebra de contrato = major bump + Changeset.

### `src/shared/event-envelope.ts`

```typescript
import { z } from 'zod';

export const EventHeadersSchema = z.object({
  event_id: z.string().uuid(),
  event_type: z.string().regex(/^[a-z_]+\.[a-z_]+\.[a-z_]+$/),
  event_version: z.string().regex(/^\d+\.\d+\.\d+$/),
  occurred_at: z.string().datetime({ offset: true }),
  tenant_id: z.string().uuid().brand<'TenantId'>(),
  correlation_id: z.string().uuid(),
  causation_id: z.string().uuid().nullable().default(null),
  producer: z.string().min(1),
});

export type EventHeaders = z.infer<typeof EventHeadersSchema>;

export const EventEnvelopeSchema = <TPayload extends z.ZodTypeAny>(
  payload: TPayload,
) => z.object({ headers: EventHeadersSchema, payload });

export type EventEnvelope<TPayload> = {
  headers: EventHeaders;
  payload: TPayload;
};
```

### `src/shared/tenant.ts` + `src/shared/ids.ts`

```typescript
// tenant.ts
export const TenantIdSchema = z.string().uuid().brand<'TenantId'>();
export type TenantId = z.infer<typeof TenantIdSchema>;

export const TenantClaimSchema = z.object({
  tenant_id: TenantIdSchema,
  user_id: z.string().uuid().brand<'UserId'>(),
  roles: z.array(z.string()),
});

// ids.ts
export const UserIdSchema = z.string().uuid().brand<'UserId'>();
export const ProgramIdSchema = z.string().uuid().brand<'ProgramId'>();
export const CitizenIdSchema = z.string().uuid().brand<'CitizenId'>();
export const ApplicationIdSchema = z.string().uuid().brand<'ApplicationId'>();
```

### `src/shared/pagination.ts`

```typescript
export const PaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20), // max 100: defesa DoS
});

export const PaginatedResultSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    next_cursor: z.string().nullable(),
    total_estimate: z.number().int().nonnegative().optional(),
  });
```

### `src/shared/error.ts` — RFC 9457 Problem Details

```typescript
export const ProblemDetailsSchema = z.object({
  type: z.string().url().default('about:blank'),
  title: z.string(),
  status: z.number().int().min(100).max(599),
  detail: z.string().optional(),
  instance: z.string().optional(),
  correlation_id: z.string().uuid().optional(),
  errors: z
    .array(
      z.object({
        path: z.string(),
        code: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});
```

### `src/auth/events.ts` — 4 eventos

| Evento                    | Payload (campos essenciais)                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `auth.tenant.created`     | `tenant_id`, `slug`, `name`, `plan`, `created_at`, `created_by`                                                 |
| `auth.tenant.deactivated` | `tenant_id`, `deactivated_at`, `reason` (enum: contract_ended/data_breach/unpaid/manual)                        |
| `auth.user.created`       | `user_id`, `tenant_id`, `roles[]`, `created_at` (sem email — é PII)                                             |
| `auth.user.deactivated`   | `user_id`, `tenant_id`, `deactivated_at`, `reason` (enum: voluntary/role_revoked/security_incident/data_breach) |

Cada um envolto via `EventEnvelopeSchema(<Payload>)`.

### `src/auth/http.ts` — 5 DTOs HTTP mínimos

| DTO                     | Schema                                                                |
| ----------------------- | --------------------------------------------------------------------- |
| `LoginRequestSchema`    | `email`, `password (min 12)`, `tenant_slug`                           |
| `LoginResponseSchema`   | `access_token`, `refresh_token`, `expires_in`, `token_type: 'Bearer'` |
| `RefreshRequestSchema`  | `refresh_token`                                                       |
| `RefreshResponseSchema` | alias de `LoginResponseSchema`                                        |
| `MeResponseSchema`      | `user{user_id,name,email}`, `tenant{tenant_id,slug,name}`, `roles[]`  |

**`MeResponse` é o único DTO que retorna email** — está autorizado pela LGPD Art. 18 II (direito de acesso aos próprios dados).

### `package.json`

```jsonc
{
  "name": "@mais-inclusao/contracts",
  "version": "0.1.0",
  "private": true,
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org",
    "provenance": true,
  },
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
    },
    "./shared": {
      "types": "./dist/shared/index.d.ts",
      "import": "./dist/shared/index.js",
      "require": "./dist/shared/index.cjs",
    },
    "./auth": {
      "types": "./dist/auth/index.d.ts",
      "import": "./dist/auth/index.js",
      "require": "./dist/auth/index.cjs",
    },
    "./package.json": "./package.json",
  },
  "sideEffects": false,
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
  },
  "dependencies": { "zod": "catalog:" },
  "devDependencies": {
    "@mais-inclusao/eslint-config": "workspace:*",
    "@mais-inclusao/tsconfig": "workspace:*",
    "tsup": "^8.3.5",
    "vitest": "catalog:",
    "zod-to-json-schema": "^3.24.1",
  },
}
```

### README — conteúdo obrigatório

- O que é (fronteira pública).
- 5 princípios não-negociáveis (acima).
- Estrutura (`shared/` universais vs subcontextos).
- Como consumir (tree-shake friendly vs flat).
- **Como adicionar novo contexto** (passo-a-passo, 5 itens).
- **Como adicionar novo evento** (passo-a-passo, 4 itens).
- **Tabela de bump** (campo opcional → minor; campo required → major; etc.).
- Snapshots JSON Schema (mecanismo + quando atualizar).
- LGPD: nota explícita sobre nunca incluir PII em payload de evento (link [ROPA](../../legal/ropa.md)).
- Naming patterns (`<context>.<entity>.<event>` snake_case; `PascalCaseEvent` tipo TS; `kebab-case.ts` arquivo).

---

## Seção 5 — Build, publicação, testes e CI

### Build (tsup) — somente `contracts`

```typescript
// packages/contracts/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'shared/index': 'src/shared/index.ts',
    'auth/index': 'src/auth/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  minify: false,
  target: 'es2023',
  external: ['zod'],
});
```

`tsconfig` e `eslint-config` não têm build — JSON e JS são distribuídos diretamente.

### Estratégia de testes

```typescript
// packages/contracts/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/**/*.d.ts'],
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
  },
});
```

**Categorias de teste** (cada schema):

1. Parse válido — dados conformes passam.
2. Parse inválido — dados malformados falham com mensagem útil.
3. Type inference — `z.infer<typeof X>` confere via TS.
4. Invariantes específicas — `EventHeadersSchema` rejeita ausência de `tenant_id`; `PaginationQuery` rejeita `limit > 100`; etc.
5. **Snapshots JSON Schema** — `zod-to-json-schema(X)` comparado contra `__snapshots__/X.snap` versionado em git.

### Integração com workflows GitHub Actions existentes

Os 8 workflows já commitados cobrem este subprojeto **sem mudança**:

| Workflow         | Comportamento neste subprojeto                                         |
| ---------------- | ---------------------------------------------------------------------- |
| `ci.yml`         | Lint, typecheck, test, build em paralelo. Turborepo cacheia.           |
| `commitlint.yml` | Escopos válidos novos: `tsconfig`, `eslint-config`, `contracts`.       |
| `dco.yml`        | Valida `Signed-off-by:` em todos commits.                              |
| `codeql.yml`     | SAST sobre novo TS.                                                    |
| `release.yml`    | Quando Changesets pendentes em `main`, abre "Version Packages" PR.     |
| `pr-labeler.yml` | Aplica labels `area:contracts`, `area:tsconfig`, `area:eslint-config`. |
| `e2e.yml`        | Não dispara (sem frontend).                                            |
| `stale.yml`      | Sem impacto direto.                                                    |

### Integração com Changesets

**Toda PR que toca `packages/contracts` exige Changeset.** Política documentada em [CONTRIBUTING.md](../../../CONTRIBUTING.md).

Tabela prática:

| Mudança                               | Bump                 | Exemplo                                       |
| ------------------------------------- | -------------------- | --------------------------------------------- |
| Adicionar campo opcional em DTO       | `minor`              | `LoginRequest` ganha `remember_me?`           |
| Adicionar novo evento ou DTO          | `minor`              | Novo `auth.session.expired`                   |
| Adicionar novo contexto (`programs/`) | `minor`              | Toda nova subdir                              |
| Bug fix em validação                  | `patch`              | Regex de slug corrigida                       |
| Adicionar campo required              | `major`              | `EventHeaders` ganha `request_id` obrigatório |
| Remover campo                         | `major`              | `LoginResponse` perde `expires_in`            |
| Renomear campo                        | `major` em 2 versões | n: ambos; n+1: só novo                        |

---

## Definition of Done

Critérios verificáveis para considerar a implementação concluída:

- [ ] 3 `package.json` criados com `name`, `version: "0.1.0"`, `private: true`, `publishConfig` completo, `exports` map.
- [ ] `packages/tsconfig/` com 5 variantes JSON + README + migração de `tsconfig.base.json` raiz em 2 commits.
- [ ] `packages/eslint-config/` com 4 arquivos em `src/` + README + presets consumíveis.
- [ ] `packages/contracts/` com `src/shared/` (5 arquivos), `src/auth/` (2 arquivos), `index.ts` raiz.
- [ ] Cada package tem `tsconfig.json` que estende variante apropriada de `@mais-inclusao/tsconfig`.
- [ ] Cada package tem `eslint.config.js` que importa preset apropriado.
- [ ] `packages/contracts` tem `tsup.config.ts` + `vitest.config.ts`; `pnpm build` gera `dist/`.
- [ ] Testes em `packages/contracts/test/` cobrem todos schemas com ≥ 1 caso válido + ≥ 1 inválido + 1 snapshot JSON Schema.
- [ ] Cobertura ≥ 90% statements (Vitest v8).
- [ ] `pnpm install` resolve symlinks sem erro.
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` passa local e no CI.
- [ ] 3 READMEs (`tsconfig`, `eslint-config`, `contracts`) com seções listadas nas Seções 2–4.
- [ ] Changeset criado declarando bumps apropriados.
- [ ] Workflows `ci.yml`, `commitlint.yml`, `dco.yml`, `codeql.yml` passam verde no PR.
- [ ] `README.md` raiz aponta para `packages/contracts/README.md` em "Como contribuir".
- [ ] CHANGELOG raiz atualizado via Changeset.

---

## Riscos e mitigações

| Risco                                                                       | Probabilidade | Impacto | Mitigação                                                                                                  |
| --------------------------------------------------------------------------- | ------------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| `flat config` ESLint 9 com `projectService` lento em monorepo               | Média         | Médio   | Limitar `allowDefaultProject` apenas a `eslint.config.js`. Bench inicial — meta < 30s.                     |
| `tsup` esconde erros de tipo (esbuild não faz typecheck)                    | Média         | Baixo   | Rodar `tsc --noEmit` em paralelo via Turbo task `typecheck`. CI já cobre.                                  |
| Snapshot quebra em mudanças triviais                                        | Baixa         | Baixo   | `zod-to-json-schema` produz output determinístico. Caso necessário, serializer com sort keys.              |
| Mudança em `eslint-config` quebra múltiplos workspaces                      | Média         | Médio   | Política: PRs em `eslint-config` exigem verificação local em ≥ 2 workspaces antes de merge; CI valida.     |
| Versão de plugins ESLint divergir entre `peerDependencies` e `dependencies` | Baixa         | Médio   | Usar `catalog:` do pnpm para versionamento centralizado. `syncpack` no CI detecta drift.                   |
| Branded types Zod confundirem contribuidores novos                          | Média         | Baixo   | README com exemplos didáticos; mensagens de erro claras dos schemas; documentar padrão em CONTRIBUTING.md. |

---

## O que NÃO está no escopo

Explicitamente fora desta spec, para evitar scope creep:

- **`packages/tailwind-config`** — entra com `packages/ui` (próxima onda de subprojeto).
- **`packages/persistence`** — depende de Postgres + Prisma rodando; vem com primeiro serviço backend.
- **`packages/messaging`** — depende de NATS rodando; vem com primeiro publisher real.
- **`packages/audit`** — depende de `persistence`.
- **`packages/observability`** — depende de OTel collector.
- **`packages/testing`** — depende de Testcontainers + decisões dos packages acima.
- **`packages/auth-react`** — depende de `packages/ui` (frontend onda).
- **`infra/docker/dev/docker-compose.yml`** — entra com `persistence`/`messaging`.
- **Qualquer app** (`apps/auth-service`, `apps/shell`, etc.).
- **Schemas de domínio fora de auth** — `programs/`, `citizens/`, `applications/` são adicionados quando o serviço correspondente nascer.
- **DTOs HTTP completos de auth** — apenas os 5 mínimos. CRUD completo (Tenants, Users, Roles) entra com `auth-service`.
- **CI rule que exige Changeset** em PRs de `contracts` — documentado mas implementação automatizada fica para subprojeto futuro.

---

## Apêndices

### A — Tabela de versionamento detalhada por package

| Package                        | Versão inicial | Versionamento via             |
| ------------------------------ | -------------- | ----------------------------- |
| `@mais-inclusao/tsconfig`      | 0.1.0          | Changesets, bump independente |
| `@mais-inclusao/eslint-config` | 0.1.0          | Changesets, bump independente |
| `@mais-inclusao/contracts`     | 0.1.0          | Changesets, bump independente |

Versão `0.1.0` (não `1.0.0`) sinaliza pre-alpha. Major bump para `1.0.0` quando primeiro tenant pagante existir.

### B — Decisões pendentes para ciclos futuros

1. Adicionar `tools/codegen/` para gerar cliente HTTP tipado a partir de `contracts` (frontend).
2. Adicionar `typedoc` para gerar docs HTML estáticas (publicação opcional via GitHub Pages).
3. Configurar CI rule (action externa ou GitHub branch protection) que **bloqueia merge** em PR de `contracts` sem Changeset.
4. Avaliar adicionar `zod-validation-error` para mensagens de erro mais humano-friendly.
5. Avaliar adicionar `tsd` para testes de tipo estritos (além de runtime).
6. Quando primeiro service consumer existir, avaliar Pact (consumer-driven contracts).
7. Possível extração de `packages/contracts-shared` + `packages/contracts-auth` se o package crescer muito (Onda 3).

### C — Stack de dependências (versão alvo, via `catalog:`)

| Dep                  | Versão   |
| -------------------- | -------- |
| `zod`                | ^3.23.8  |
| `eslint`             | ^9.16.0  |
| `typescript`         | ^5.6.3   |
| `typescript-eslint`  | ^8.16.0  |
| `vitest`             | ^2.1.5   |
| `tsup`               | ^8.3.5   |
| `zod-to-json-schema` | ^3.24.1  |
| `globals`            | ^15.13.0 |

Versões exatas finais ficam no `pnpm-workspace.yaml` (catalog) já configurado.

### D — Próximos subprojetos planejados (após este)

| Ordem | Subprojeto                                                                      | Por quê depois deste                                      |
| ----- | ------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 2     | Infra dev local (`infra/docker/dev/docker-compose.yml` + dotenv pattern)        | Precisa para próximos packages testarem com PG/NATS reais |
| 3     | `packages/persistence` (TenantAwareRepository + Prisma base)                    | Consumido pelos 4 serviços                                |
| 4     | `packages/messaging` (NATS wrapper + Outbox dispatcher)                         | Idem                                                      |
| 5     | `packages/observability` (Pino + OTel preset)                                   | Idem                                                      |
| 6     | `apps/auth-service` (primeiro serviço, consome contracts/persistence/messaging) | Marco visível: login funcional                            |

---

**Fim do documento.** Próximo artefato: plano de implementação via `writing-plans` skill.
