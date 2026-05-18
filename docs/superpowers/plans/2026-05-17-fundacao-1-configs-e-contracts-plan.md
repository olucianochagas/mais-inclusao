# Fundação 1 — Configs compartilhadas + `packages/contracts` core — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar 3 packages internos no monorepo (`@mais-inclusao/tsconfig`, `@mais-inclusao/eslint-config`, `@mais-inclusao/contracts`) que servem de fundação técnica para todos os serviços e apps subsequentes. Ao final, `pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build` passa local e no CI, com cobertura ≥ 90% em `contracts`.

**Architecture:** 3 packages com dependência sequencial: `tsconfig` (JSON estático) é consumido por `eslint-config` (flat config JS) e `contracts` (TypeScript+Zod, build com tsup). `contracts` exporta tipos branded (`TenantId`, `UserId`, etc.), `EventEnvelope` Zod genérico, e os primeiros 4 eventos + 5 DTOs HTTP do contexto `auth`. Testes Vitest unit + snapshots JSON Schema versionados detectam breaking change não-intencional.

**Tech Stack:** TypeScript 5.6 (strict), Zod 3, ESLint 9 (flat config), Vitest 2, tsup 8, zod-to-json-schema 3, pnpm 11.1.2 (corepack), Turborepo 2.9. Conventional Commits + DCO obrigatórios.

**Spec de referência:** [`docs/superpowers/specs/2026-05-17-fundacao-1-configs-e-contracts-design.md`](../specs/2026-05-17-fundacao-1-configs-e-contracts-design.md)

---

## Sumário de tasks

| #   | Task                                                      | Estimativa | Commits        |
| --- | --------------------------------------------------------- | ---------- | -------------- |
| 1   | Setup inicial e branch                                    | 5 min      | 0 (preparação) |
| 2   | `packages/tsconfig` — criar package + 5 variantes         | 30 min     | 1              |
| 3   | Migração do `tsconfig.base.json` raiz                     | 10 min     | 1              |
| 4   | `packages/tsconfig` — README                              | 15 min     | 1              |
| 5   | `packages/eslint-config` — scaffold + preset base         | 30 min     | 1              |
| 6   | `packages/eslint-config` — presets `nest`, `react`, `lib` | 30 min     | 1              |
| 7   | `packages/eslint-config` — README                         | 15 min     | 1              |
| 8   | `packages/contracts` — scaffold (package.json, configs)   | 20 min     | 1              |
| 9   | `packages/contracts` — `shared/tenant.ts` (TDD)           | 25 min     | 1              |
| 10  | `packages/contracts` — `shared/ids.ts` (TDD)              | 20 min     | 1              |
| 11  | `packages/contracts` — `shared/event-envelope.ts` (TDD)   | 30 min     | 1              |
| 12  | `packages/contracts` — `shared/pagination.ts` (TDD)       | 20 min     | 1              |
| 13  | `packages/contracts` — `shared/error.ts` (TDD)            | 20 min     | 1              |
| 14  | `packages/contracts` — `shared/index.ts` + `src/index.ts` | 10 min     | 1              |
| 15  | `packages/contracts` — `auth/events.ts` (TDD)             | 40 min     | 1              |
| 16  | `packages/contracts` — `auth/http.ts` (TDD)               | 35 min     | 1              |
| 17  | `packages/contracts` — `auth/index.ts` + atualizar root   | 10 min     | 1              |
| 18  | `packages/contracts` — setup tsup build                   | 15 min     | 1              |
| 19  | `packages/contracts` — snapshots JSON Schema              | 25 min     | 1              |
| 20  | `packages/contracts` — README                             | 25 min     | 1              |
| 21  | Verificação final + cobertura ≥ 90%                       | 20 min     | 0–1            |
| 22  | Changeset + atualização CHANGELOG                         | 15 min     | 1              |
| 23  | Verificação CI local + cross-check Definition of Done     | 15 min     | 0–1            |

**Estimativa total:** ~7-9h de trabalho efetivo. **~22 commits atômicos.**

---

## Task 1: Setup inicial e branch

**Files:** verificação apenas + nova branch.

- [ ] **Step 1: Verificar estado limpo**

```bash
cd /home/luciano-douglas/www/mais-inclusao
git status --short
```

Expected: vazio (working tree clean). Se houver mudanças não commitadas, parar e investigar.

- [ ] **Step 2: Confirmar branch atual = main**

```bash
git branch --show-current
```

Expected: `main`.

- [ ] **Step 3: Criar branch do subprojeto**

```bash
git checkout -b feat/fundacao-1-configs-contracts
git branch --show-current
```

Expected: `feat/fundacao-1-configs-contracts`.

- [ ] **Step 4: Verificar pnpm e Node**

```bash
node --version && corepack pnpm --version
```

Expected: `v24.15.0` (ou compatível) e `11.1.2`.

- [ ] **Step 5: Reinstalar deps limpas (sanity)**

```bash
pnpm install --frozen-lockfile
```

Expected: `Done in <Xs>` sem erros.

---

## Task 2: `packages/tsconfig` — criar package + 5 variantes

**Files:**

- Create: `packages/tsconfig/package.json`
- Create: `packages/tsconfig/base.json`
- Create: `packages/tsconfig/nest.json`
- Create: `packages/tsconfig/react.json`
- Create: `packages/tsconfig/lib.json`
- Create: `packages/tsconfig/test.json`
- Create: `packages/tsconfig/tsconfig.json` (self-typecheck)
- Delete: `packages/.gitkeep`

- [ ] **Step 1: Criar diretório do package e remover .gitkeep**

```bash
mkdir -p packages/tsconfig
rm -f packages/.gitkeep
ls -la packages/
```

Expected: `tsconfig/` criado, `.gitkeep` removido.

- [ ] **Step 2: Criar `packages/tsconfig/package.json`**

```json
{
  "$schema": "https://json.schemastore.org/package.json",
  "name": "@mais-inclusao/tsconfig",
  "version": "0.1.0",
  "private": true,
  "description": "Configurações TypeScript compartilhadas do monorepo +Inclusão.",
  "license": "ISC",
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org",
    "provenance": true
  },
  "type": "commonjs",
  "exports": {
    "./base.json": "./base.json",
    "./nest.json": "./nest.json",
    "./react.json": "./react.json",
    "./lib.json": "./lib.json",
    "./test.json": "./test.json"
  },
  "files": ["*.json", "README.md"],
  "keywords": ["typescript", "tsconfig", "mais-inclusao", "monorepo"]
}
```

- [ ] **Step 3: Criar `packages/tsconfig/base.json` (cópia byte-a-byte do raiz)**

```bash
cp tsconfig.base.json packages/tsconfig/base.json
head -5 packages/tsconfig/base.json
```

Expected: primeiras 5 linhas mostram `$schema` + `compilerOptions` (idêntico ao arquivo raiz atual).

- [ ] **Step 4: Criar `packages/tsconfig/nest.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "useDefineForClassFields": false,
    "types": ["node"],
    "lib": ["ES2023"],
    "composite": true,
    "jsx": "preserve"
  }
}
```

- [ ] **Step 5: Criar `packages/tsconfig/react.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "composite": false,
    "module": "ESNext",
    "moduleResolution": "Bundler"
  }
}
```

> `@module-federation/enhanced/runtime` em `types` será adicionado no ciclo do `packages/ui`. Aqui mantemos só `vite/client` para evitar dependência fantasma.

- [ ] **Step 6: Criar `packages/tsconfig/lib.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "stripInternal": true,
    "removeComments": false,
    "module": "ESNext",
    "moduleResolution": "Bundler"
  }
}
```

- [ ] **Step 7: Criar `packages/tsconfig/test.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "types": ["node", "vitest/globals"],
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "isolatedModules": false,
    "composite": false
  }
}
```

- [ ] **Step 8: Criar `packages/tsconfig/tsconfig.json` (self-typecheck)**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "include": ["*.json"]
}
```

- [ ] **Step 9: Instalar workspace**

```bash
pnpm install
```

Expected: pnpm registra `@mais-inclusao/tsconfig`, sem erros.

- [ ] **Step 10: Verificar reconhecimento**

```bash
pnpm list -r --depth -1 | grep tsconfig
```

Expected: `@mais-inclusao/tsconfig@0.1.0 packages/tsconfig`.

- [ ] **Step 11: Commit**

```bash
git add packages/.gitkeep packages/tsconfig/
git commit -s -m "$(cat <<'COMMIT'
feat(tsconfig): criar @mais-inclusao/tsconfig com 5 variantes

5 variantes JSON consumíveis via exports map:
- base.json: strict + extras universais (ES2023, Bundler, isolatedModules,
  verbatimModuleSyntax, noUncheckedIndexedAccess).
- nest.json: backend NestJS — decorators, NodeNext, types node, composite.
- react.json: frontend MF — jsx react-jsx, DOM lib, Bundler resolution.
- lib.json: packages publicáveis — declaration, declarationMap, sourceMap,
  composite, stripInternal.
- test.json: arquivos .test.ts — types vitest/globals, relaxa unused.

Package privado com publishConfig pronto. Sem dependências. Distribuído
direto via files+exports (sem build).

Refs: docs/superpowers/specs/2026-05-17-fundacao-1-configs-e-contracts-design.md § 2
COMMIT
)"
```

Expected: commit criado.

---

## Task 3: Migração do `tsconfig.base.json` raiz

**Files:**

- Modify: `tsconfig.base.json` (raiz, reduzir a `extends`)

- [ ] **Step 1: Substituir conteúdo do `tsconfig.base.json` raiz**

Conteúdo novo:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@mais-inclusao/tsconfig/base.json"
}
```

Salve em `/home/luciano-douglas/www/mais-inclusao/tsconfig.base.json`.

- [ ] **Step 2: Verificar que `extends` resolve**

```bash
pnpm exec tsc --showConfig -p tsconfig.base.json 2>&1 | head -25
```

Expected: configurações expandidas (vê-se `"target": "es2023"`, `"strict": true`, etc.).

- [ ] **Step 3: Commit**

```bash
git add tsconfig.base.json
git commit -s -m "$(cat <<'COMMIT'
refactor(tsconfig): apontar tsconfig.base.json raiz para @mais-inclusao/tsconfig

tsconfig.base.json raiz agora apenas estende @mais-inclusao/tsconfig/base.json.
Preserva project references e backward-compat para qualquer caminho que ainda
referencie a base raiz.

Mudança em 2 commits:
1) packages/tsconfig/base.json criado com cópia idêntica (commit anterior).
2) Raiz reduzida a apenas extends (este commit).

git log --follow tsconfig.base.json continua rastreando evolução.
COMMIT
)"
```

Expected: commit criado.

---

## Task 4: `packages/tsconfig` — README

**Files:**

- Create: `packages/tsconfig/README.md`

- [ ] **Step 1: Criar README com tabela, exemplos e justificativas**

Conteúdo de `packages/tsconfig/README.md` (escrever via Write tool):

````markdown
# @mais-inclusao/tsconfig

Configurações TypeScript compartilhadas do monorepo **+Inclusão**. Cada workspace estende uma variante apropriada — eliminando configs locais divergentes.

## Variantes

| Variante                             | Quando usar                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| `@mais-inclusao/tsconfig/base.json`  | Núcleo strict — outros extendem dele. Raramente usado direto.                |
| `@mais-inclusao/tsconfig/nest.json`  | Apps backend NestJS (`auth-service`, `programs-service`, `bff-*`, etc.)      |
| `@mais-inclusao/tsconfig/react.json` | Apps frontend Module Federation (`shell`, `gestor-mf`, `cidadao-mf`)         |
| `@mais-inclusao/tsconfig/lib.json`   | Packages publicáveis (`@mais-inclusao/contracts`, `@mais-inclusao/ui`, etc.) |
| `@mais-inclusao/tsconfig/test.json`  | Arquivos `*.test.ts` e `test/` — relaxa unused, adiciona globals do Vitest   |

## Exemplos

### App NestJS

`apps/auth-service/tsconfig.json`:

```jsonc
{
  "extends": "@mais-inclusao/tsconfig/nest.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts", "test/**", "dist/**"],
}
```

### App React (Module Federation)

`apps/cidadao-mf/tsconfig.json`:

```jsonc
{
  "extends": "@mais-inclusao/tsconfig/react.json",
  "compilerOptions": { "outDir": "./dist" },
  "include": ["src/**/*"],
}
```

### Package publicável

`packages/contracts/tsconfig.json`:

```jsonc
{
  "extends": "@mais-inclusao/tsconfig/lib.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src" },
  "include": ["src/**/*"],
  "exclude": ["dist/**", "test/**"],
}
```

### Testes em qualquer workspace

`packages/contracts/tsconfig.test.json`:

```jsonc
{
  "extends": "@mais-inclusao/tsconfig/test.json",
  "include": ["test/**/*", "src/**/*"],
}
```

## Strict justificado

A base habilita strict do TypeScript + 5 extras críticos:

- **`noUncheckedIndexedAccess`** — força tratar `arr[i]` como `T | undefined`. Em código LGPD evita classes inteiras de bugs onde o programador assume que `users[0]` existe. Ver [ADR-0006](../../docs/adr/0006-criptografia-pii-em-coluna-kek-por-tenant.md).
- **`noImplicitOverride`** — `override` keyword obrigatória; evita "override sombra" silencioso.
- **`noImplicitReturns`** — função com retorno em alguns caminhos mas não em todos = erro.
- **`noFallthroughCasesInSwitch`** — `case` sem `break/return` = erro.
- **`useUnknownInCatchVariables`** — `catch (e)` ⇒ `e: unknown` (não `any`).

E `isolatedModules: true` + `verbatimModuleSyntax: true` são exigências do esbuild/swc usados por Rspack e Vitest.

## Quando criar nova variante

Regra prática: **se ≥ 2 workspaces precisam da mesma config**, vira variante neste package. Caso único = config local no próprio workspace.

## Migração

O `tsconfig.base.json` raiz apenas estende `@mais-inclusao/tsconfig/base.json` para preservar project references existentes. Não duplicar configs.
````

- [ ] **Step 2: Verificar referências internas**

```bash
grep -nE '\]\(\.\./' packages/tsconfig/README.md
```

Expected: 1 referência ao ADR-0006.

- [ ] **Step 3: Commit**

```bash
git add packages/tsconfig/README.md
git commit -s -m "docs(tsconfig): documentar uso das 5 variantes com exemplos"
```

Expected: commit criado.

---

## Task 5: `packages/eslint-config` — scaffold + preset base

**Files:**

- Create: `packages/eslint-config/package.json`
- Create: `packages/eslint-config/tsconfig.json`
- Create: `packages/eslint-config/src/index.js`
- Create: `packages/eslint-config/eslint.config.js` (self-lint)

- [ ] **Step 1: Criar diretório**

```bash
mkdir -p packages/eslint-config/src
```

- [ ] **Step 2: Criar `packages/eslint-config/package.json`**

```json
{
  "$schema": "https://json.schemastore.org/package.json",
  "name": "@mais-inclusao/eslint-config",
  "version": "0.1.0",
  "private": true,
  "description": "ESLint 9 flat config presets compartilhados do monorepo +Inclusão.",
  "license": "ISC",
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org",
    "provenance": true
  },
  "type": "module",
  "exports": {
    ".": "./src/index.js",
    "./nest": "./src/nest.js",
    "./react": "./src/react.js",
    "./lib": "./src/lib.js"
  },
  "files": ["src", "README.md"],
  "scripts": {
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "eslint": "catalog:",
    "typescript": "catalog:"
  },
  "dependencies": {
    "@eslint/js": "^9.16.0",
    "typescript-eslint": "catalog:",
    "eslint-plugin-import": "catalog:",
    "eslint-plugin-simple-import-sort": "catalog:",
    "eslint-plugin-security": "catalog:",
    "eslint-plugin-react": "catalog:",
    "eslint-plugin-react-hooks": "catalog:",
    "eslint-plugin-jsx-a11y": "catalog:",
    "globals": "^15.13.0"
  },
  "devDependencies": {
    "@mais-inclusao/tsconfig": "workspace:*"
  }
}
```

- [ ] **Step 3: Criar `packages/eslint-config/tsconfig.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@mais-inclusao/tsconfig/test.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true
  },
  "include": ["src/**/*", "eslint.config.js"]
}
```

- [ ] **Step 4: Criar `packages/eslint-config/src/index.js` (preset base)**

```javascript
// @mais-inclusao/eslint-config — preset base
//
// Importado por nest.js, react.js e lib.js. Pode ser consumido direto
// via `import config from '@mais-inclusao/eslint-config'` quando workspace
// não se encaixa nas 3 categorias específicas.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import security from 'eslint-plugin-security';

/**
 * Configuração base: TypeScript strict + organização de imports + segurança.
 * @type {import('eslint').Linter.Config[]}
 */
export const base = tseslint.config(
  js.configs.recommended,

  // typescript-eslint v8 strict + stylistic com type checking
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    plugins: {
      import: importPlugin,
      'simple-import-sort': simpleImportSort,
      security,
    },
    languageOptions: {
      parserOptions: {
        // Type-aware linting sem listar tsconfigs manualmente
        projectService: {
          allowDefaultProject: ['eslint.config.js', '*.config.{js,ts,mjs,cjs}'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Organização de imports
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/no-extraneous-dependencies': 'error',
      'import/no-cycle': ['error', { maxDepth: 10 }],
      'import/no-self-import': 'error',
      'import/no-duplicates': 'error',

      // TypeScript strict (extras sobre strictTypeChecked)
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // Segurança (eslint-plugin-security) — descrição em README
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-non-literal-fs-filename': 'warn',

      // Higiene geral
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      eqeqeq: ['error', 'always'],
      'no-implicit-coercion': 'error',
    },
  },

  // Relaxar regras em arquivos de teste
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/test/**', '**/__tests__/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'security/detect-object-injection': 'off',
      'no-console': 'off',
    },
  },

  // Arquivos de configuração
  {
    files: [
      '*.config.{js,ts,mjs,cjs}',
      'src/index.js',
      'src/nest.js',
      'src/react.js',
      'src/lib.js',
    ],
    rules: {
      'import/no-default-export': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);

export default base;
```

- [ ] **Step 5: Criar `packages/eslint-config/eslint.config.js` (self-lint)**

```javascript
// Self-lint deste próprio package
import baseConfig from './src/index.js';

export default [...baseConfig, { ignores: ['node_modules/**', 'dist/**'] }];
```

- [ ] **Step 6: Instalar deps**

```bash
pnpm install
```

> Se algum `catalog:` faltar, falha com `ERR_PNPM_CATALOG_ENTRY_NOT_FOUND`. Adicionar entry em `pnpm-workspace.yaml` na seção `catalog:` conforme a § 3 da spec.

Expected: `Done in <Xs>` sem erros.

- [ ] **Step 7: Verificar instalação**

```bash
pnpm list -r --depth -1 | grep -E 'eslint-config|tsconfig'
```

Expected: 2 packages listados.

- [ ] **Step 8: Self-lint**

```bash
cd packages/eslint-config && pnpm lint && cd ../..
```

Expected: zero warnings/errors.

- [ ] **Step 9: Self-typecheck**

```bash
cd packages/eslint-config && pnpm typecheck && cd ../..
```

Expected: zero erros TS.

- [ ] **Step 10: Commit**

```bash
git add packages/eslint-config/
git commit -s -m "$(cat <<'COMMIT'
feat(eslint-config): criar @mais-inclusao/eslint-config com preset base

Preset base (src/index.js) usa ESLint 9 flat config:
- typescript-eslint strict + stylistic com type checking
- eslint-plugin-import: organização, no-cycle, no-self-import, no-duplicates
- eslint-plugin-simple-import-sort: ordenação determinística
- eslint-plugin-security: 5 rules ativas (detect-eval-with-expression,
  detect-unsafe-regex, detect-non-literal-regexp, detect-object-injection,
  detect-non-literal-fs-filename)
- Higiene: no-console (exceto warn/error), no-debugger, eqeqeq,
  no-implicit-coercion
- consistent-type-imports inline (fixStyle inline-type-imports)
- Relaxa regras em arquivos de teste e config

parserOptions.projectService com allowDefaultProject para configs JS/TS
na raiz do workspace — type-aware linting sem listar tsconfigs manualmente.

Refs: docs/superpowers/specs/2026-05-17-fundacao-1-configs-e-contracts-design.md § 3
COMMIT
)"
```

Expected: commit criado.

---

## Task 6: `packages/eslint-config` — presets `nest`, `react`, `lib`

**Files:**

- Create: `packages/eslint-config/src/nest.js`
- Create: `packages/eslint-config/src/react.js`
- Create: `packages/eslint-config/src/lib.js`

- [ ] **Step 1: Criar `packages/eslint-config/src/nest.js`**

```javascript
// @mais-inclusao/eslint-config/nest — preset para apps backend NestJS

import globals from 'globals';

import { base } from './index.js';

export default [
  ...base,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      // NestJS usa classes injetáveis e decorators — relaxa regras incompatíveis
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/parameter-properties': 'off',

      // Decorators precisam dos tipos em runtime — não pode ser type-only import
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports', disallowTypeAnnotations: false },
      ],

      // Tenant guard: serviços não podem instanciar PrismaClient direto
      // (precisa passar pelo TenantAwareRepository de @mais-inclusao/persistence)
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@prisma/client',
              importNames: ['PrismaClient'],
              message:
                'Use TenantAwareRepository de @mais-inclusao/persistence — nunca instancie PrismaClient direto. Ver ADR-0005.',
            },
          ],
        },
      ],
    },
  },
];
```

- [ ] **Step 2: Criar `packages/eslint-config/src/react.js`**

```javascript
// @mais-inclusao/eslint-config/react — preset para apps frontend MF

import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

import { base } from './index.js';

export default [
  ...base,
  {
    files: ['**/*.{ts,tsx,jsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.strict.rules,

      // React 19: novas convenções
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'off',

      // A11y crítico (ADR-0007: WCAG 2.2 AA como Definition of Done)
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
      'jsx-a11y/label-has-associated-control': [
        'error',
        { required: { every: ['nesting', 'id'] } },
      ],
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/no-autofocus': ['error', { ignoreNonDOM: true }],
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/tabindex-no-positive': 'error',
    },
  },
];
```

- [ ] **Step 3: Criar `packages/eslint-config/src/lib.js`**

```javascript
// @mais-inclusao/eslint-config/lib — preset para packages publicáveis

import { base } from './index.js';

export default [
  ...base,
  {
    rules: {
      // Libraries: rigor com exports e API pública
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',

      // Libraries usam named exports — default exports atrapalham tree-shaking
      'import/no-default-export': 'error',

      // Forçar consumer a entrar pelo index.ts
      'import/no-internal-modules': [
        'error',
        {
          allow: [
            // Sub-paths exportados via exports map (./shared, ./auth)
            '@mais-inclusao/*/+(shared|auth|programs|citizens|applications)',
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.config.{ts,js,mjs,cjs}'],
    rules: { 'import/no-default-export': 'off' },
  },
];
```

- [ ] **Step 4: Self-lint dos 3 presets**

```bash
cd packages/eslint-config && pnpm lint && cd ../..
```

Expected: zero warnings/errors.

- [ ] **Step 5: Verificar import dos presets**

```bash
cd packages/eslint-config && node -e "import('./src/nest.js').then(m => console.log('nest:', m.default.length))" && cd ../..
```

Expected: `nest: <N>` com N ≥ 5.

- [ ] **Step 6: Commit**

```bash
git add packages/eslint-config/src/nest.js packages/eslint-config/src/react.js packages/eslint-config/src/lib.js
git commit -s -m "$(cat <<'COMMIT'
feat(eslint-config): adicionar presets nest, react e lib

nest (apps backend NestJS):
- globals Node
- Desabilita no-extraneous-class e parameter-properties (NestJS usa muito)
- consistent-type-imports com disallowTypeAnnotations: false
  (decorators precisam de tipos em runtime)
- no-restricted-imports bloqueia PrismaClient direto (força uso de
  TenantAwareRepository de @mais-inclusao/persistence — ADR-0005)

react (apps frontend MF):
- globals browser, JSX, react-hooks, jsx-a11y strict
- React 19: react/react-in-jsx-scope off, prop-types off (TypeScript)
- jsx-a11y reforçado: click-events-have-key-events, label-has-associated-
  control, no-autofocus, tabindex-no-positive (ADR-0007 WCAG 2.2 AA)

lib (packages publicáveis):
- explicit-function-return-type + explicit-module-boundary-types
- no-default-export (named exports são tree-shake friendly)
- no-internal-modules forçando consumer a usar exports map
COMMIT
)"
```

Expected: commit criado.

---

## Task 7: `packages/eslint-config` — README

**Files:**

- Create: `packages/eslint-config/README.md`

- [ ] **Step 1: Criar README**

Conteúdo de `packages/eslint-config/README.md` (escrever via Write tool):

````markdown
# @mais-inclusao/eslint-config

ESLint 9 flat config presets compartilhados do monorepo **+Inclusão**. Cada workspace declara `eslint.config.js` minimal importando um dos 4 presets.

## Filosofia

- **ESLint 9 flat config.** Sem `.eslintrc` legacy.
- **Type-aware linting** via `parserOptions.projectService` — sem listar tsconfigs manualmente.
- **Strict por padrão.** Acessibilidade (`jsx-a11y` strict) e segurança (`eslint-plugin-security`) embutidas.

## Presets

| Preset                                | Quando usar                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| `@mais-inclusao/eslint-config` (base) | Workspaces que não se encaixam nas 3 categorias abaixo.                      |
| `@mais-inclusao/eslint-config/nest`   | Apps backend NestJS (`auth-service`, `bff-*`, etc.)                          |
| `@mais-inclusao/eslint-config/react`  | Apps frontend Module Federation (`shell`, `gestor-mf`, `cidadao-mf`)         |
| `@mais-inclusao/eslint-config/lib`    | Packages publicáveis (`@mais-inclusao/contracts`, `@mais-inclusao/ui`, etc.) |

## Exemplos

### App NestJS

`apps/auth-service/eslint.config.js`:

```javascript
import nestConfig from '@mais-inclusao/eslint-config/nest';

export default [...nestConfig, { ignores: ['dist/**', '**/*.generated.ts'] }];
```

### App React (Module Federation)

`apps/cidadao-mf/eslint.config.js`:

```javascript
import reactConfig from '@mais-inclusao/eslint-config/react';

export default [...reactConfig, { ignores: ['dist/**', '.rspack/**'] }];
```

### Package publicável

`packages/contracts/eslint.config.js`:

```javascript
import libConfig from '@mais-inclusao/eslint-config/lib';

export default [...libConfig, { ignores: ['dist/**'] }];
```

### Adicionar override local

```javascript
import libConfig from '@mais-inclusao/eslint-config/lib';

export default [
  ...libConfig,
  {
    files: ['src/legacy/**'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
];
```

## Rules de segurança ativas

Do `eslint-plugin-security` (em ordem de severidade):

- **`detect-eval-with-expression`** (error) — Detecta avaliação dinâmica de expressões como código.
- **`detect-non-literal-regexp`** (error) — Regex construída de string externa (DoS catastrófico — ReDoS).
- **`detect-unsafe-regex`** (error) — Padrão regex vulnerável a ReDoS.
- **`detect-object-injection`** (warn) — Acesso `obj[key]` onde `key` vem de input externo.
- **`detect-non-literal-fs-filename`** (warn) — `fs.read(path)` com path dinâmico.

## A11y rigor

O preset `react` usa **`jsx-a11y` strict** (não `recommended`). Justificativa em [ADR-0007 — WCAG 2.2 AA como Definition of Done](../../docs/adr/0007-wcag-22-aa-como-definition-of-done.md).

Rules adicionais reforçadas:

- `click-events-have-key-events` — todo `onClick` precisa de `onKeyDown` equivalente.
- `label-has-associated-control` — labels obrigatórias em inputs.
- `no-autofocus` — focus management deve ser explícito.
- `tabindex-no-positive` — tabindex > 0 quebra ordem natural.

## Restrições do preset `nest`

`no-restricted-imports` bloqueia `import { PrismaClient } from '@prisma/client'` direto. Serviços NestJS **precisam** passar pelo `TenantAwareRepository` de `@mais-inclusao/persistence` para garantir invariante de `tenant_id` em queries (defesa em profundidade — [ADR-0005](../../docs/adr/0005-multi-tenancy-defesa-em-profundidade.md)).

## Como propor nova rule

1. Identifique se a rule afeta **≥ 2 workspaces** (caso contrário, mantenha local).
2. Abra PR com:
   - Mudança em `src/<preset>.js`.
   - Justificativa no PR description.
   - Verificação local em ≥ 2 workspaces antes de marcar pronto.
3. Changeset declarando bump apropriado:
   - Mudança de severidade (`warn → error`) = **major** (vai quebrar lints).
   - Nova rule com `fix` automático seguro = **minor**.
   - Bug fix em config existente = **patch**.

## Performance

`parserOptions.projectService` com `allowDefaultProject` permite type-aware linting de configs raiz sem listar tsconfigs.

Bench inicial alvo: < 30s para lint completo do monorepo. Se acima, considerar mais ignores em arquivos gerados ou reduzir `import/no-cycle` maxDepth.
````

- [ ] **Step 2: Verificar links**

```bash
grep -nE '\]\(\.\./' packages/eslint-config/README.md
```

Expected: 2 referências a ADRs (0005 e 0007).

- [ ] **Step 3: Commit**

```bash
git add packages/eslint-config/README.md
git commit -s -m "docs(eslint-config): documentar 4 presets, segurança, a11y e governança de rules"
```

Expected: commit criado.

---

## Task 8: `packages/contracts` — scaffold

**Files:**

- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/tsconfig.test.json`
- Create: `packages/contracts/eslint.config.js`
- Create: `packages/contracts/vitest.config.ts`
- Create: `packages/contracts/tsup.config.ts`
- Create: estrutura de pastas (`src/shared`, `src/auth`, `test/shared`, `test/auth`)

- [ ] **Step 1: Criar estrutura de pastas**

```bash
mkdir -p packages/contracts/src/shared packages/contracts/src/auth
mkdir -p packages/contracts/test/shared packages/contracts/test/auth
ls -la packages/contracts/
```

Expected: diretórios `src/` e `test/` com subdirs.

- [ ] **Step 2: Criar `packages/contracts/package.json`**

```json
{
  "$schema": "https://json.schemastore.org/package.json",
  "name": "@mais-inclusao/contracts",
  "version": "0.1.0",
  "private": true,
  "description": "Schemas Zod, eventos e DTOs públicos do monorepo +Inclusão. Fronteira pública entre serviços.",
  "license": "ISC",
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org",
    "provenance": true
  },
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./shared": {
      "types": "./dist/shared/index.d.ts",
      "import": "./dist/shared/index.js",
      "require": "./dist/shared/index.cjs"
    },
    "./auth": {
      "types": "./dist/auth/index.d.ts",
      "import": "./dist/auth/index.js",
      "require": "./dist/auth/index.cjs"
    },
    "./package.json": "./package.json"
  },
  "sideEffects": false,
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.test.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "zod": "catalog:"
  },
  "devDependencies": {
    "@mais-inclusao/eslint-config": "workspace:*",
    "@mais-inclusao/tsconfig": "workspace:*",
    "@vitest/coverage-v8": "catalog:",
    "tsup": "^8.3.5",
    "vitest": "catalog:",
    "zod-to-json-schema": "^3.24.1"
  }
}
```

- [ ] **Step 3: Criar `packages/contracts/tsconfig.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@mais-inclusao/tsconfig/lib.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["dist/**", "node_modules/**", "test/**"]
}
```

- [ ] **Step 4: Criar `packages/contracts/tsconfig.test.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@mais-inclusao/tsconfig/test.json",
  "include": ["src/**/*", "test/**/*"]
}
```

- [ ] **Step 5: Criar `packages/contracts/eslint.config.js`**

```javascript
import libConfig from '@mais-inclusao/eslint-config/lib';

export default [...libConfig, { ignores: ['dist/**', '__snapshots__/**'] }];
```

- [ ] **Step 6: Criar `packages/contracts/vitest.config.ts`**

```typescript
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
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
```

- [ ] **Step 7: Criar `packages/contracts/tsup.config.ts`**

```typescript
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

- [ ] **Step 8: Verificar `@vitest/coverage-v8` no catalog do pnpm-workspace.yaml**

```bash
grep -nE 'coverage-v8|vitest' pnpm-workspace.yaml
```

Se faltar, adicionar na seção `catalog:`:

```yaml
catalog:
  # ... entries existentes ...
  '@vitest/coverage-v8': ^2.1.5
```

- [ ] **Step 9: Instalar deps**

```bash
pnpm install
```

Expected: `Done in <Xs>` sem erros. `vitest`, `tsup`, `zod`, `zod-to-json-schema` instalados.

- [ ] **Step 10: Verificar workspace**

```bash
pnpm list -r --depth -1 | grep -E 'contracts|eslint-config|tsconfig'
```

Expected: 3 packages listados.

- [ ] **Step 11: Commit (sem src/ ainda — só scaffold)**

```bash
git add packages/contracts/package.json packages/contracts/tsconfig.json packages/contracts/tsconfig.test.json packages/contracts/eslint.config.js packages/contracts/vitest.config.ts packages/contracts/tsup.config.ts pnpm-workspace.yaml pnpm-lock.yaml
git commit -s -m "$(cat <<'COMMIT'
build(contracts): scaffold de @mais-inclusao/contracts (configs sem código ainda)

Estrutura inicial do package que será o ponto crítico do monorepo
(fronteira pública entre serviços — ADR-0001 destaque):

- package.json: type module, exports map nested (root, /shared, /auth),
  sideEffects false, build via tsup ESM+CJS+.d.ts.
- tsconfig.json estende @mais-inclusao/tsconfig/lib.json (declaration,
  declarationMap, composite, stripInternal).
- tsconfig.test.json para Vitest com type test.json relaxado.
- eslint.config.js importa preset lib (no-default-export, explicit returns).
- vitest.config.ts com thresholds 90/85/90/90 e provider v8.
- tsup.config.ts com 3 entries (index, shared/index, auth/index), tree-shake,
  external zod.

Próximos commits: implementação TDD dos schemas em src/shared/ e src/auth/.
COMMIT
)"
```

Expected: commit criado.

---

## Task 9: `packages/contracts/src/shared/tenant.ts` (TDD)

**Files:**

- Create: `packages/contracts/test/shared/tenant.test.ts`
- Create: `packages/contracts/src/shared/tenant.ts`

- [ ] **Step 1: Escrever o teste falhando**

Criar `packages/contracts/test/shared/tenant.test.ts`:

```typescript
import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  type TenantClaim,
  TenantClaimSchema,
  type TenantId,
  TenantIdSchema,
} from '../../src/shared/tenant.js';

describe('TenantIdSchema', () => {
  it('aceita UUID v4 válido', () => {
    const valid = '550e8400-e29b-41d4-a716-446655440000';
    expect(() => TenantIdSchema.parse(valid)).not.toThrow();
  });

  it('rejeita string vazia', () => {
    expect(() => TenantIdSchema.parse('')).toThrow();
  });

  it('rejeita UUID malformado', () => {
    expect(() => TenantIdSchema.parse('not-a-uuid')).toThrow();
  });

  it('rejeita número', () => {
    expect(() => TenantIdSchema.parse(42)).toThrow();
  });

  it('preserva o brand TenantId no tipo inferido', () => {
    expectTypeOf<TenantId>().toMatchTypeOf<string>();
    const id = TenantIdSchema.parse('550e8400-e29b-41d4-a716-446655440000');
    expectTypeOf(id).toEqualTypeOf<TenantId>();
  });
});

describe('TenantClaimSchema', () => {
  const validClaim = {
    tenant_id: '550e8400-e29b-41d4-a716-446655440000',
    user_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    roles: ['admin', 'editor'],
  };

  it('aceita claim válido completo', () => {
    expect(() => TenantClaimSchema.parse(validClaim)).not.toThrow();
  });

  it('rejeita claim sem tenant_id', () => {
    const { tenant_id, ...withoutTenant } = validClaim;
    expect(() => TenantClaimSchema.parse(withoutTenant)).toThrow();
  });

  it('rejeita claim sem user_id', () => {
    const { user_id, ...withoutUser } = validClaim;
    expect(() => TenantClaimSchema.parse(withoutUser)).toThrow();
  });

  it('rejeita roles não-array', () => {
    expect(() =>
      TenantClaimSchema.parse({ ...validClaim, roles: 'admin' }),
    ).toThrow();
  });

  it('aceita roles vazio (sem permissão)', () => {
    expect(() =>
      TenantClaimSchema.parse({ ...validClaim, roles: [] }),
    ).not.toThrow();
  });

  it('infere TenantClaim corretamente', () => {
    const parsed = TenantClaimSchema.parse(validClaim);
    expectTypeOf(parsed).toMatchTypeOf<TenantClaim>();
  });
});
```

- [ ] **Step 2: Rodar teste — deve falhar**

```bash
cd packages/contracts && pnpm test test/shared/tenant.test.ts 2>&1 | tail -10
```

Expected: FAIL com mensagem `Failed to load url ../../src/shared/tenant.js` (módulo não existe).

- [ ] **Step 3: Implementar `packages/contracts/src/shared/tenant.ts`**

```typescript
import { z } from 'zod';

/**
 * Identificador único de tenant (organização que opera no +Inclusão).
 *
 * UUID v4 branded — impede passar string crua onde TenantId é esperado.
 * Em runtime é apenas string; o brand vive apenas no sistema de tipos.
 *
 * @example
 * const tenantId: TenantId = TenantIdSchema.parse('550e8400-...');
 */
export const TenantIdSchema = z.string().uuid().brand<'TenantId'>();
export type TenantId = z.infer<typeof TenantIdSchema>;

/**
 * Claim do JWT lido por todo Guard de aplicação.
 *
 * Materializado no AsyncLocalStorage de cada request. Repository base
 * usa essas informações para injetar `WHERE tenant_id = ...` em queries.
 *
 * Ver ADR-0005 — Multi-tenancy com defesa em profundidade.
 */
export const TenantClaimSchema = z.object({
  tenant_id: TenantIdSchema,
  user_id: z.string().uuid().brand<'UserId'>(),
  roles: z.array(z.string()),
});
export type TenantClaim = z.infer<typeof TenantClaimSchema>;
```

- [ ] **Step 4: Rodar testes — devem passar**

```bash
cd packages/contracts && pnpm test test/shared/tenant.test.ts 2>&1 | tail -15
```

Expected: `Test Files  1 passed` e `Tests  N passed` (N ≥ 11).

- [ ] **Step 5: Typecheck + lint**

```bash
cd packages/contracts && pnpm typecheck && pnpm lint && cd ../..
```

Expected: zero erros.

- [ ] **Step 6: Commit**

```bash
git add packages/contracts/src/shared/tenant.ts packages/contracts/test/shared/tenant.test.ts
git commit -s -m "$(cat <<'COMMIT'
feat(contracts): adicionar shared/tenant — TenantIdSchema e TenantClaimSchema

TenantIdSchema:
- UUID v4 branded (brand 'TenantId').
- Em runtime é string; brand vive só no sistema de tipos.
- Impede passar string crua onde TenantId é esperado (defesa contra
  cross-tenant leak — ADR-0005).

TenantClaimSchema:
- Shape do JWT claim que todo Guard lê: { tenant_id, user_id, roles }.
- Materializado no AsyncLocalStorage de cada request.

11 testes Vitest cobrindo: UUID válido/inválido, claim com/sem campos,
roles vazias permitidas, type inference correta via expectTypeOf.
COMMIT
)"
```

Expected: commit criado.

---

## Task 10: `packages/contracts/src/shared/ids.ts` (TDD)

**Files:**

- Create: `packages/contracts/test/shared/ids.test.ts`
- Create: `packages/contracts/src/shared/ids.ts`

- [ ] **Step 1: Escrever testes**

Criar `packages/contracts/test/shared/ids.test.ts`:

```typescript
import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  type ApplicationId,
  ApplicationIdSchema,
  type CitizenId,
  CitizenIdSchema,
  type ProgramId,
  ProgramIdSchema,
  type UserId,
  UserIdSchema,
} from '../../src/shared/ids.js';

const validUuid = '550e8400-e29b-41d4-a716-446655440000';

describe.each([
  ['UserIdSchema', UserIdSchema],
  ['ProgramIdSchema', ProgramIdSchema],
  ['CitizenIdSchema', CitizenIdSchema],
  ['ApplicationIdSchema', ApplicationIdSchema],
])('%s', (_name, schema) => {
  it('aceita UUID válido', () => {
    expect(() => schema.parse(validUuid)).not.toThrow();
  });

  it('rejeita UUID malformado', () => {
    expect(() => schema.parse('xxx')).toThrow();
  });

  it('rejeita não-string', () => {
    expect(() => schema.parse(42)).toThrow();
    expect(() => schema.parse(null)).toThrow();
    expect(() => schema.parse(undefined)).toThrow();
  });
});

describe('Brand types', () => {
  it('UserId é distinto de ProgramId no sistema de tipos', () => {
    const userId = UserIdSchema.parse(validUuid);
    const programId = ProgramIdSchema.parse(validUuid);
    expectTypeOf(userId).not.toMatchTypeOf<ProgramId>();
    expectTypeOf(programId).not.toMatchTypeOf<UserId>();
  });

  it('CitizenId é distinto de ApplicationId', () => {
    const citizenId = CitizenIdSchema.parse(validUuid);
    const applicationId = ApplicationIdSchema.parse(validUuid);
    expectTypeOf(citizenId).not.toMatchTypeOf<ApplicationId>();
    expectTypeOf(applicationId).not.toMatchTypeOf<CitizenId>();
  });
});
```

- [ ] **Step 2: Rodar testes — devem falhar**

```bash
cd packages/contracts && pnpm test test/shared/ids.test.ts 2>&1 | tail -5
```

Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar `packages/contracts/src/shared/ids.ts`**

```typescript
import { z } from 'zod';

/**
 * Identificadores branded de entidades do domínio +Inclusão.
 *
 * Em runtime cada ID é apenas string (UUID v4). Os brands vivem no sistema
 * de tipos para evitar confusão entre tipos — passar `UserId` onde se
 * espera `CitizenId` é erro de compilação.
 *
 * Pattern: cada bounded context define seu brand. Adicionar aqui apenas
 * IDs **universais** (cross-context); IDs locais ficam no contexto.
 */

export const UserIdSchema = z.string().uuid().brand<'UserId'>();
export type UserId = z.infer<typeof UserIdSchema>;

export const ProgramIdSchema = z.string().uuid().brand<'ProgramId'>();
export type ProgramId = z.infer<typeof ProgramIdSchema>;

export const CitizenIdSchema = z.string().uuid().brand<'CitizenId'>();
export type CitizenId = z.infer<typeof CitizenIdSchema>;

export const ApplicationIdSchema = z.string().uuid().brand<'ApplicationId'>();
export type ApplicationId = z.infer<typeof ApplicationIdSchema>;
```

- [ ] **Step 4: Rodar testes — devem passar**

```bash
cd packages/contracts && pnpm test test/shared/ids.test.ts 2>&1 | tail -10
```

Expected: testes passam.

- [ ] **Step 5: Lint + typecheck**

```bash
cd packages/contracts && pnpm lint && pnpm typecheck && cd ../..
```

Expected: zero erros.

- [ ] **Step 6: Commit**

```bash
git add packages/contracts/src/shared/ids.ts packages/contracts/test/shared/ids.test.ts
git commit -s -m "feat(contracts): adicionar shared/ids — UserId, ProgramId, CitizenId, ApplicationId branded"
```

Expected: commit criado.

---

## Task 11: `packages/contracts/src/shared/event-envelope.ts` (TDD)

**Files:**

- Create: `packages/contracts/test/shared/event-envelope.test.ts`
- Create: `packages/contracts/src/shared/event-envelope.ts`

- [ ] **Step 1: Escrever testes**

Criar `packages/contracts/test/shared/event-envelope.test.ts`:

```typescript
import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';

import {
  type EventEnvelope,
  EventEnvelopeSchema,
  type EventHeaders,
  EventHeadersSchema,
} from '../../src/shared/event-envelope.js';

const validHeaders = {
  event_id: '550e8400-e29b-41d4-a716-446655440000',
  event_type: 'auth.tenant.created',
  event_version: '1.0.0',
  occurred_at: '2026-05-17T10:30:00Z',
  tenant_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  correlation_id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  causation_id: null,
  producer: 'auth-service',
};

describe('EventHeadersSchema', () => {
  it('aceita headers válidos completos', () => {
    expect(() => EventHeadersSchema.parse(validHeaders)).not.toThrow();
  });

  describe('event_id', () => {
    it('rejeita não-UUID', () => {
      expect(() =>
        EventHeadersSchema.parse({ ...validHeaders, event_id: 'not-uuid' }),
      ).toThrow();
    });
  });

  describe('event_type', () => {
    it('aceita pattern <context>.<entity>.<event>', () => {
      const valid = ['auth.tenant.created', 'programs.program.published'];
      for (const t of valid) {
        expect(() =>
          EventHeadersSchema.parse({ ...validHeaders, event_type: t }),
        ).not.toThrow();
      }
    });

    it('rejeita pattern com PascalCase', () => {
      expect(() =>
        EventHeadersSchema.parse({
          ...validHeaders,
          event_type: 'Auth.Tenant.Created',
        }),
      ).toThrow();
    });

    it('rejeita pattern com menos de 3 partes', () => {
      expect(() =>
        EventHeadersSchema.parse({
          ...validHeaders,
          event_type: 'auth.created',
        }),
      ).toThrow();
    });

    it('rejeita pattern com hífen', () => {
      expect(() =>
        EventHeadersSchema.parse({
          ...validHeaders,
          event_type: 'auth.user-created.event',
        }),
      ).toThrow();
    });
  });

  describe('event_version', () => {
    it('aceita SemVer válido', () => {
      const valid = ['0.1.0', '1.0.0', '10.20.30'];
      for (const v of valid) {
        expect(() =>
          EventHeadersSchema.parse({ ...validHeaders, event_version: v }),
        ).not.toThrow();
      }
    });

    it('rejeita SemVer parcial', () => {
      expect(() =>
        EventHeadersSchema.parse({ ...validHeaders, event_version: '1.0' }),
      ).toThrow();
    });

    it('rejeita prerelease', () => {
      expect(() =>
        EventHeadersSchema.parse({
          ...validHeaders,
          event_version: '1.0.0-alpha',
        }),
      ).toThrow();
    });
  });

  describe('tenant_id (INVARIANTE)', () => {
    it('rejeita ausência (defesa cross-tenant)', () => {
      const { tenant_id, ...withoutTenant } = validHeaders;
      expect(() => EventHeadersSchema.parse(withoutTenant)).toThrow();
    });

    it('rejeita string vazia', () => {
      expect(() =>
        EventHeadersSchema.parse({ ...validHeaders, tenant_id: '' }),
      ).toThrow();
    });
  });

  describe('occurred_at', () => {
    it('aceita ISO 8601 com offset UTC', () => {
      expect(() =>
        EventHeadersSchema.parse({
          ...validHeaders,
          occurred_at: '2026-05-17T10:30:00Z',
        }),
      ).not.toThrow();
    });

    it('aceita ISO 8601 com offset numérico', () => {
      expect(() =>
        EventHeadersSchema.parse({
          ...validHeaders,
          occurred_at: '2026-05-17T10:30:00-03:00',
        }),
      ).not.toThrow();
    });

    it('rejeita data sem offset', () => {
      expect(() =>
        EventHeadersSchema.parse({
          ...validHeaders,
          occurred_at: '2026-05-17T10:30:00',
        }),
      ).toThrow();
    });
  });

  describe('causation_id', () => {
    it('aceita null (eventos raiz)', () => {
      expect(() =>
        EventHeadersSchema.parse({ ...validHeaders, causation_id: null }),
      ).not.toThrow();
    });

    it('aceita ausência (default null)', () => {
      const { causation_id, ...withoutCausation } = validHeaders;
      const parsed = EventHeadersSchema.parse(withoutCausation);
      expect(parsed.causation_id).toBeNull();
    });

    it('aceita UUID', () => {
      expect(() =>
        EventHeadersSchema.parse({
          ...validHeaders,
          causation_id: '550e8400-e29b-41d4-a716-446655440099',
        }),
      ).not.toThrow();
    });
  });

  describe('producer', () => {
    it('rejeita string vazia', () => {
      expect(() =>
        EventHeadersSchema.parse({ ...validHeaders, producer: '' }),
      ).toThrow();
    });
  });

  it('infere EventHeaders corretamente', () => {
    const parsed = EventHeadersSchema.parse(validHeaders);
    expectTypeOf(parsed).toMatchTypeOf<EventHeaders>();
  });
});

describe('EventEnvelopeSchema', () => {
  const PayloadSchema = z.object({ foo: z.string(), bar: z.number() });

  it('compõe envelope tipado com payload', () => {
    const Envelope = EventEnvelopeSchema(PayloadSchema);
    const valid = { headers: validHeaders, payload: { foo: 'hello', bar: 42 } };
    expect(() => Envelope.parse(valid)).not.toThrow();
  });

  it('rejeita envelope com payload errado', () => {
    const Envelope = EventEnvelopeSchema(PayloadSchema);
    const invalid = {
      headers: validHeaders,
      payload: { foo: 'hello', bar: 'not-number' },
    };
    expect(() => Envelope.parse(invalid)).toThrow();
  });

  it('rejeita envelope sem headers', () => {
    const Envelope = EventEnvelopeSchema(PayloadSchema);
    expect(() => Envelope.parse({ payload: { foo: 'hi', bar: 1 } })).toThrow();
  });

  it('tipo EventEnvelope<T> reflete payload', () => {
    type X = EventEnvelope<{ foo: string }>;
    expectTypeOf<X['headers']>().toMatchTypeOf<EventHeaders>();
    expectTypeOf<X['payload']>().toEqualTypeOf<{ foo: string }>();
  });
});
```

- [ ] **Step 2: Rodar testes — devem falhar**

```bash
cd packages/contracts && pnpm test test/shared/event-envelope.test.ts 2>&1 | tail -5
```

Expected: FAIL.

- [ ] **Step 3: Implementar `packages/contracts/src/shared/event-envelope.ts`**

```typescript
import { z } from 'zod';

/**
 * Headers obrigatórios em todo evento publicado no NATS JetStream (+Inclusão).
 *
 * Materializa o padrão definido em ADR-0004 (Mensageria NATS JetStream + Outbox).
 *
 * Validação dupla obrigatória:
 * - Publicador valida ANTES de inserir no outbox_event.
 * - Consumer valida ANTES de processar (idempotência via event_id).
 *
 * Invariante crítica: `tenant_id` é obrigatório. Consumer rejeita eventos
 * sem ele (defesa de cross-tenant leak — ADR-0005, camada 5).
 *
 * @see docs/adr/0004-nats-jetstream-outbox-pattern.md
 * @see docs/adr/0005-multi-tenancy-defesa-em-profundidade.md
 */
export const EventHeadersSchema = z.object({
  /** UUID v4. Vira NATS Msg-ID. Garante dedup window de 2min do JetStream. */
  event_id: z.string().uuid(),

  /** Pattern `<context>.<entity>.<event>` em snake_case. */
  event_type: z.string().regex(/^[a-z_]+\.[a-z_]+\.[a-z_]+$/, {
    message: 'event_type deve seguir <context>.<entity>.<event> em snake_case',
  }),

  /** SemVer do payload. Major bump = breaking change exige Changeset. */
  event_version: z.string().regex(/^\d+\.\d+\.\d+$/, {
    message: 'event_version deve seguir SemVer (e.g. "1.0.0")',
  }),

  /** ISO 8601 com timezone obrigatório. */
  occurred_at: z.string().datetime({ offset: true }),

  /** UUID v4 branded. INVARIANTE — todo evento traz tenant_id. */
  tenant_id: z.string().uuid().brand<'TenantId'>(),

  /** UUID v4. Rastreia uma operação ponta-a-ponta. */
  correlation_id: z.string().uuid(),

  /** UUID do evento que causou este (cadeia). Null para raízes. */
  causation_id: z.string().uuid().nullable().default(null),

  /** Nome do serviço produtor (e.g., "auth-service"). */
  producer: z.string().min(1),
});

export type EventHeaders = z.infer<typeof EventHeadersSchema>;

/**
 * Constrói um schema de evento completo a partir do schema do payload.
 *
 * @example
 * const TenantCreatedSchema = EventEnvelopeSchema(
 *   z.object({ tenant_id: TenantIdSchema, name: z.string() })
 * );
 */
export const EventEnvelopeSchema = <TPayload extends z.ZodTypeAny>(
  payload: TPayload,
): z.ZodObject<{
  headers: typeof EventHeadersSchema;
  payload: TPayload;
}> =>
  z.object({
    headers: EventHeadersSchema,
    payload,
  });

/** Helper utilitário para typar resultado do envelope. */
export type EventEnvelope<TPayload> = {
  headers: EventHeaders;
  payload: TPayload;
};
```

- [ ] **Step 4: Rodar testes**

```bash
cd packages/contracts && pnpm test test/shared/event-envelope.test.ts 2>&1 | tail -15
```

Expected: todos os testes passam (~20).

- [ ] **Step 5: Lint + typecheck**

```bash
cd packages/contracts && pnpm lint && pnpm typecheck && cd ../..
```

Expected: zero erros.

- [ ] **Step 6: Commit**

```bash
git add packages/contracts/src/shared/event-envelope.ts packages/contracts/test/shared/event-envelope.test.ts
git commit -s -m "$(cat <<'COMMIT'
feat(contracts): adicionar shared/event-envelope — coração do pattern de evento

EventHeadersSchema com 8 campos obrigatórios:
- event_id (UUID v4, vira NATS Msg-ID)
- event_type (regex <context>.<entity>.<event> snake_case)
- event_version (SemVer regex)
- occurred_at (ISO 8601 com offset obrigatório)
- tenant_id (INVARIANTE — defesa cross-tenant, ADR-0005)
- correlation_id (rastreio ponta-a-ponta)
- causation_id (nullable, default null para raízes)
- producer (nome do serviço, min 1)

EventEnvelopeSchema<TPayload> helper genérico para compor schema de evento
a partir do schema de payload.

Tipos derivados via z.infer: EventHeaders, EventEnvelope<T>.

~20 testes Vitest cobrindo cada campo: válido, inválido, edge cases
(UUID malformado, SemVer parcial, datetime sem offset, tenant_id obrigatório,
causation_id null/default, type inference).

Refs: ADR-0004, ADR-0005
COMMIT
)"
```

Expected: commit criado.

---

## Task 12: `packages/contracts/src/shared/pagination.ts` (TDD)

**Files:**

- Create: `packages/contracts/test/shared/pagination.test.ts`
- Create: `packages/contracts/src/shared/pagination.ts`

- [ ] **Step 1: Escrever testes**

`packages/contracts/test/shared/pagination.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  PaginatedResultSchema,
  PaginationQuerySchema,
} from '../../src/shared/pagination.js';

describe('PaginationQuerySchema', () => {
  it('aceita query vazia (usa defaults)', () => {
    const parsed = PaginationQuerySchema.parse({});
    expect(parsed.limit).toBe(20);
    expect(parsed.cursor).toBeUndefined();
  });

  it('aceita limit válido', () => {
    expect(PaginationQuerySchema.parse({ limit: 50 }).limit).toBe(50);
  });

  it('coage string numérica (query string)', () => {
    expect(PaginationQuerySchema.parse({ limit: '25' }).limit).toBe(25);
  });

  it('rejeita limit = 0', () => {
    expect(() => PaginationQuerySchema.parse({ limit: 0 })).toThrow();
  });

  it('rejeita limit negativo', () => {
    expect(() => PaginationQuerySchema.parse({ limit: -1 })).toThrow();
  });

  it('rejeita limit > 100 (defesa DoS)', () => {
    expect(() => PaginationQuerySchema.parse({ limit: 101 })).toThrow();
    expect(() => PaginationQuerySchema.parse({ limit: 1000 })).toThrow();
  });

  it('rejeita limit não-inteiro', () => {
    expect(() => PaginationQuerySchema.parse({ limit: 1.5 })).toThrow();
  });

  it('aceita cursor opaco', () => {
    expect(PaginationQuerySchema.parse({ cursor: 'abc123==' }).cursor).toBe(
      'abc123==',
    );
  });
});

describe('PaginatedResultSchema', () => {
  const ItemSchema = z.object({ id: z.string(), name: z.string() });
  const ResultSchema = PaginatedResultSchema(ItemSchema);

  it('aceita result válido com next_cursor', () => {
    const data = {
      items: [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
      ],
      next_cursor: 'abc',
    };
    expect(() => ResultSchema.parse(data)).not.toThrow();
  });

  it('aceita result vazio com next_cursor null', () => {
    expect(() =>
      ResultSchema.parse({ items: [], next_cursor: null }),
    ).not.toThrow();
  });

  it('aceita total_estimate opcional', () => {
    expect(() =>
      ResultSchema.parse({
        items: [],
        next_cursor: null,
        total_estimate: 42,
      }),
    ).not.toThrow();
  });

  it('rejeita total_estimate negativo', () => {
    expect(() =>
      ResultSchema.parse({
        items: [],
        next_cursor: null,
        total_estimate: -1,
      }),
    ).toThrow();
  });

  it('rejeita item que não casa com schema', () => {
    expect(() =>
      ResultSchema.parse({
        items: [{ id: 1, name: 'wrong-type' }],
        next_cursor: null,
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Rodar — devem falhar**

```bash
cd packages/contracts && pnpm test test/shared/pagination.test.ts 2>&1 | tail -5
```

- [ ] **Step 3: Implementar `packages/contracts/src/shared/pagination.ts`**

```typescript
import { z } from 'zod';

/**
 * Query string padrão de paginação cursor-based.
 *
 * Aplicado em todos endpoints `GET /<recurso>` que retornem coleção.
 * `limit` é coerce-friendly (query strings vêm como string).
 *
 * Limite max 100 — defesa contra DoS de queries grandes.
 */
export const PaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/**
 * Resultado paginado genérico.
 *
 * `next_cursor: null` indica que não há mais páginas.
 * `total_estimate` é opcional — alguns endpoints podem fornecê-lo se
 * for barato calcular; outros omitirão por custo de query.
 */
export const PaginatedResultSchema = <TItem extends z.ZodTypeAny>(
  item: TItem,
): z.ZodObject<{
  items: z.ZodArray<TItem>;
  next_cursor: z.ZodNullable<z.ZodString>;
  total_estimate: z.ZodOptional<z.ZodNumber>;
}> =>
  z.object({
    items: z.array(item),
    next_cursor: z.string().nullable(),
    total_estimate: z.number().int().nonnegative().optional(),
  });

export type PaginatedResult<T> = {
  items: T[];
  next_cursor: string | null;
  total_estimate?: number;
};
```

- [ ] **Step 4: Testes passam, lint + typecheck**

```bash
cd packages/contracts && pnpm test test/shared/pagination.test.ts && pnpm lint && pnpm typecheck && cd ../..
```

Expected: tudo verde.

- [ ] **Step 5: Commit**

```bash
git add packages/contracts/src/shared/pagination.ts packages/contracts/test/shared/pagination.test.ts
git commit -s -m "feat(contracts): adicionar shared/pagination — cursor-based, limit max 100 (DoS defense)"
```

---

## Task 13: `packages/contracts/src/shared/error.ts` (TDD)

**Files:**

- Create: `packages/contracts/test/shared/error.test.ts`
- Create: `packages/contracts/src/shared/error.ts`

- [ ] **Step 1: Escrever testes**

`packages/contracts/test/shared/error.test.ts`:

```typescript
import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  type ProblemDetails,
  ProblemDetailsSchema,
} from '../../src/shared/error.js';

describe('ProblemDetailsSchema', () => {
  const minimal = { title: 'Bad Request', status: 400 };

  it('aceita problem details mínimo', () => {
    const parsed = ProblemDetailsSchema.parse(minimal);
    expect(parsed.type).toBe('about:blank');
    expect(parsed.title).toBe('Bad Request');
    expect(parsed.status).toBe(400);
  });

  it('aceita type customizado URL', () => {
    const data = { ...minimal, type: 'https://mais-inclusao.org/errors/x' };
    expect(() => ProblemDetailsSchema.parse(data)).not.toThrow();
  });

  it('rejeita type não-URL', () => {
    expect(() =>
      ProblemDetailsSchema.parse({ ...minimal, type: 'not-a-url' }),
    ).toThrow();
  });

  it('rejeita status < 100', () => {
    expect(() =>
      ProblemDetailsSchema.parse({ ...minimal, status: 99 }),
    ).toThrow();
  });

  it('rejeita status > 599', () => {
    expect(() =>
      ProblemDetailsSchema.parse({ ...minimal, status: 600 }),
    ).toThrow();
  });

  it('rejeita status não-inteiro', () => {
    expect(() =>
      ProblemDetailsSchema.parse({ ...minimal, status: 400.5 }),
    ).toThrow();
  });

  it('aceita correlation_id UUID', () => {
    expect(() =>
      ProblemDetailsSchema.parse({
        ...minimal,
        correlation_id: '550e8400-e29b-41d4-a716-446655440000',
      }),
    ).not.toThrow();
  });

  it('rejeita correlation_id não-UUID', () => {
    expect(() =>
      ProblemDetailsSchema.parse({ ...minimal, correlation_id: 'not-uuid' }),
    ).toThrow();
  });

  it('aceita extension errors[]', () => {
    expect(() =>
      ProblemDetailsSchema.parse({
        ...minimal,
        errors: [
          { path: 'body.email', code: 'invalid_email', message: 'Invalid' },
          { path: 'body.password', code: 'too_short', message: 'Too short' },
        ],
      }),
    ).not.toThrow();
  });

  it('rejeita errors[] com item incompleto', () => {
    expect(() =>
      ProblemDetailsSchema.parse({
        ...minimal,
        errors: [{ path: 'body.email' }],
      }),
    ).toThrow();
  });

  it('aceita detail e instance opcionais', () => {
    const parsed = ProblemDetailsSchema.parse({
      ...minimal,
      detail: 'Email already in use',
      instance: 'https://api.example.com/requests/abc123',
    });
    expect(parsed.detail).toBe('Email already in use');
    expect(parsed.instance).toBe('https://api.example.com/requests/abc123');
  });

  it('infere ProblemDetails corretamente', () => {
    const parsed = ProblemDetailsSchema.parse(minimal);
    expectTypeOf(parsed).toMatchTypeOf<ProblemDetails>();
  });
});
```

- [ ] **Step 2: Rodar — devem falhar**

```bash
cd packages/contracts && pnpm test test/shared/error.test.ts 2>&1 | tail -5
```

- [ ] **Step 3: Implementar `packages/contracts/src/shared/error.ts`**

```typescript
import { z } from 'zod';

/**
 * Padrão de erro HTTP unificado conforme RFC 9457 (Problem Details for HTTP APIs).
 *
 * Todo BFF e service retornam este shape em erros 4xx/5xx.
 *
 * Importante (LGPD): NÃO incluir PII em `detail`, `instance` ou
 * `errors[].message` que são enviados ao cliente. Detalhes de PII vão em
 * logs do servidor, com `correlation_id` ligando log à resposta.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc9457
 */
export const ProblemDetailsSchema = z.object({
  /**
   * URI que identifica o tipo do erro.
   * Default 'about:blank' indica erro genérico sem doc específica.
   */
  type: z.string().url().default('about:blank'),

  /** Resumo curto, legível por humano. Não muda entre instâncias. */
  title: z.string(),

  /** Status HTTP (100-599). */
  status: z.number().int().min(100).max(599),

  /** Detalhe específico desta instância (sem PII!). */
  detail: z.string().optional(),

  /** URI da instância (e.g., link para o request_id em log). */
  instance: z.string().optional(),

  // ─── Extensions específicas do +Inclusão (permitido por RFC 9457 § 3.2) ───

  /** UUID que liga esta resposta a logs do servidor (sem PII). */
  correlation_id: z.string().uuid().optional(),

  /** Lista de erros de validação por campo. */
  errors: z
    .array(
      z.object({
        /** Path JSON do campo com erro, e.g., "body.email". */
        path: z.string(),
        /** Código semântico do erro. */
        code: z.string(),
        /** Mensagem amigável (sem PII!). */
        message: z.string(),
      }),
    )
    .optional(),
});

export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;
```

- [ ] **Step 4: Testes + lint + typecheck**

```bash
cd packages/contracts && pnpm test test/shared/error.test.ts && pnpm lint && pnpm typecheck && cd ../..
```

Expected: tudo verde.

- [ ] **Step 5: Commit**

```bash
git add packages/contracts/src/shared/error.ts packages/contracts/test/shared/error.test.ts
git commit -s -m "feat(contracts): adicionar shared/error — ProblemDetails RFC 9457 com extensions LGPD-safe"
```

---

## Task 14: `packages/contracts/src/shared/index.ts` + `src/index.ts`

**Files:**

- Create: `packages/contracts/src/shared/index.ts`
- Create: `packages/contracts/src/index.ts` (placeholder)

- [ ] **Step 1: Criar `packages/contracts/src/shared/index.ts`**

```typescript
// @mais-inclusao/contracts/shared — tipos e schemas universais

export * from './error.js';
export * from './event-envelope.js';
export * from './ids.js';
export * from './pagination.js';
export * from './tenant.js';
```

- [ ] **Step 2: Criar `packages/contracts/src/index.ts` (placeholder até Task 17)**

```typescript
// @mais-inclusao/contracts — re-export flat para consumers
// Tree-shake friendly graças a sideEffects: false no package.json.

export * from './shared/index.js';
// auth re-exports adicionados na Task 17 quando src/auth/index.ts existir.
```

- [ ] **Step 3: Lint + typecheck + testes**

```bash
cd packages/contracts && pnpm lint && pnpm typecheck && pnpm test test/shared/ && cd ../..
```

Expected: tudo verde, todos os testes shared passam.

- [ ] **Step 4: Commit**

```bash
git add packages/contracts/src/shared/index.ts packages/contracts/src/index.ts
git commit -s -m "feat(contracts): adicionar src/shared/index.ts e src/index.ts (re-exports)"
```

---

## Task 15: `packages/contracts/src/auth/events.ts` (TDD)

**Files:**

- Create: `packages/contracts/test/auth/events.test.ts`
- Create: `packages/contracts/src/auth/events.ts`

- [ ] **Step 1: Escrever testes**

`packages/contracts/test/auth/events.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import {
  TenantCreatedEventSchema,
  type TenantCreatedPayload,
  TenantDeactivatedEventSchema,
  UserCreatedEventSchema,
  UserDeactivatedEventSchema,
} from '../../src/auth/events.js';

const headers = {
  event_id: '550e8400-e29b-41d4-a716-446655440000',
  event_type: 'auth.tenant.created',
  event_version: '1.0.0',
  occurred_at: '2026-05-17T10:30:00Z',
  tenant_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  correlation_id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  causation_id: null,
  producer: 'auth-service',
};

describe('TenantCreatedEventSchema', () => {
  const validPayload: TenantCreatedPayload = {
    tenant_id:
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8' as TenantCreatedPayload['tenant_id'],
    slug: 'sec-assistencia-sp',
    name: 'Secretaria de Assistência Social de São Paulo',
    plan: 'starter',
    created_at: '2026-05-17T10:30:00Z',
    created_by: 'admin@mais-inclusao',
  };

  it('aceita evento válido completo', () => {
    expect(() =>
      TenantCreatedEventSchema.parse({ headers, payload: validPayload }),
    ).not.toThrow();
  });

  it('rejeita slug muito longo (> 64)', () => {
    expect(() =>
      TenantCreatedEventSchema.parse({
        headers,
        payload: { ...validPayload, slug: 'x'.repeat(65) },
      }),
    ).toThrow();
  });

  it('rejeita slug vazio', () => {
    expect(() =>
      TenantCreatedEventSchema.parse({
        headers,
        payload: { ...validPayload, slug: '' },
      }),
    ).toThrow();
  });

  it('rejeita plan inválido', () => {
    expect(() =>
      TenantCreatedEventSchema.parse({
        headers,
        payload: { ...validPayload, plan: 'platinum' as never },
      }),
    ).toThrow();
  });

  it('aceita todos os planos válidos', () => {
    const plans = ['free', 'starter', 'pro', 'enterprise'] as const;
    for (const plan of plans) {
      expect(() =>
        TenantCreatedEventSchema.parse({
          headers,
          payload: { ...validPayload, plan },
        }),
      ).not.toThrow();
    }
  });

  it('rejeita name vazio', () => {
    expect(() =>
      TenantCreatedEventSchema.parse({
        headers,
        payload: { ...validPayload, name: '' },
      }),
    ).toThrow();
  });

  it('rejeita name > 200 chars', () => {
    expect(() =>
      TenantCreatedEventSchema.parse({
        headers,
        payload: { ...validPayload, name: 'x'.repeat(201) },
      }),
    ).toThrow();
  });
});

describe('TenantDeactivatedEventSchema', () => {
  const validPayload = {
    tenant_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    deactivated_at: '2026-05-17T10:30:00Z',
    reason: 'contract_ended' as const,
  };

  it('aceita evento válido', () => {
    expect(() =>
      TenantDeactivatedEventSchema.parse({ headers, payload: validPayload }),
    ).not.toThrow();
  });

  it('aceita todos os reasons válidos', () => {
    const reasons = [
      'contract_ended',
      'data_breach',
      'unpaid',
      'manual',
    ] as const;
    for (const reason of reasons) {
      expect(() =>
        TenantDeactivatedEventSchema.parse({
          headers,
          payload: { ...validPayload, reason },
        }),
      ).not.toThrow();
    }
  });

  it('rejeita reason inválido', () => {
    expect(() =>
      TenantDeactivatedEventSchema.parse({
        headers,
        payload: { ...validPayload, reason: 'whatever' as never },
      }),
    ).toThrow();
  });
});

describe('UserCreatedEventSchema', () => {
  const validPayload = {
    user_id: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
    tenant_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    roles: ['gestor', 'triagem'],
    created_at: '2026-05-17T10:30:00Z',
  };

  it('aceita evento válido', () => {
    expect(() =>
      UserCreatedEventSchema.parse({ headers, payload: validPayload }),
    ).not.toThrow();
  });

  it('rejeita roles vazias', () => {
    expect(() =>
      UserCreatedEventSchema.parse({
        headers,
        payload: { ...validPayload, roles: [] },
      }),
    ).toThrow();
  });

  it('aceita 1 role', () => {
    expect(() =>
      UserCreatedEventSchema.parse({
        headers,
        payload: { ...validPayload, roles: ['gestor'] },
      }),
    ).not.toThrow();
  });

  it('NÃO inclui email (PII protegida)', () => {
    const parsed = UserCreatedEventSchema.parse({
      headers,
      payload: validPayload,
    });
    expect('email' in parsed.payload).toBe(false);
  });
});

describe('UserDeactivatedEventSchema', () => {
  const validPayload = {
    user_id: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
    tenant_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    deactivated_at: '2026-05-17T10:30:00Z',
    reason: 'voluntary' as const,
  };

  it('aceita evento válido', () => {
    expect(() =>
      UserDeactivatedEventSchema.parse({ headers, payload: validPayload }),
    ).not.toThrow();
  });

  it('aceita todos os reasons', () => {
    const reasons = [
      'voluntary',
      'role_revoked',
      'security_incident',
      'data_breach',
    ] as const;
    for (const reason of reasons) {
      expect(() =>
        UserDeactivatedEventSchema.parse({
          headers,
          payload: { ...validPayload, reason },
        }),
      ).not.toThrow();
    }
  });
});
```

- [ ] **Step 2: Rodar — devem falhar**

```bash
cd packages/contracts && pnpm test test/auth/events.test.ts 2>&1 | tail -5
```

- [ ] **Step 3: Implementar `packages/contracts/src/auth/events.ts`**

```typescript
import { z } from 'zod';

import { EventEnvelopeSchema } from '../shared/event-envelope.js';
import { TenantIdSchema, UserIdSchema } from '../shared/index.js';

// ─── auth.tenant.created ─────────────────────────────────────

/**
 * Tenant foi provisionado (via CLI ou painel admin futuro).
 *
 * Sem email, telefone ou outros PII do operador — apenas IDs e fatos.
 */
export const TenantCreatedPayloadSchema = z.object({
  tenant_id: TenantIdSchema,
  slug: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  plan: z.enum(['free', 'starter', 'pro', 'enterprise']),
  created_at: z.string().datetime({ offset: true }),
  /** Identifier do operador SaaS que provisionou (não é UserId interno). */
  created_by: z.string().min(1),
});

export const TenantCreatedEventSchema = EventEnvelopeSchema(
  TenantCreatedPayloadSchema,
);
export type TenantCreatedPayload = z.infer<typeof TenantCreatedPayloadSchema>;
export type TenantCreatedEvent = z.infer<typeof TenantCreatedEventSchema>;

// ─── auth.tenant.deactivated ─────────────────────────────────

/**
 * Tenant foi desativado. Consumer programs-service encerra programs órfãos.
 */
export const TenantDeactivatedPayloadSchema = z.object({
  tenant_id: TenantIdSchema,
  deactivated_at: z.string().datetime({ offset: true }),
  /** `data_breach` aciona protocolos LGPD. */
  reason: z.enum(['contract_ended', 'data_breach', 'unpaid', 'manual']),
});

export const TenantDeactivatedEventSchema = EventEnvelopeSchema(
  TenantDeactivatedPayloadSchema,
);
export type TenantDeactivatedPayload = z.infer<
  typeof TenantDeactivatedPayloadSchema
>;
export type TenantDeactivatedEvent = z.infer<
  typeof TenantDeactivatedEventSchema
>;

// ─── auth.user.created ───────────────────────────────────────

/**
 * Usuário gestor foi criado em um tenant.
 *
 * **IMPORTANTE (LGPD)**: NÃO inclui email, nome ou outros PII no payload.
 * Consumer que precisa fazer lookup faz via auth-service autenticado.
 */
export const UserCreatedPayloadSchema = z.object({
  user_id: UserIdSchema,
  tenant_id: TenantIdSchema,
  /** Pelo menos 1 role. Sem roles = usuário inútil. */
  roles: z.array(z.string()).min(1),
  created_at: z.string().datetime({ offset: true }),
});

export const UserCreatedEventSchema = EventEnvelopeSchema(
  UserCreatedPayloadSchema,
);
export type UserCreatedPayload = z.infer<typeof UserCreatedPayloadSchema>;
export type UserCreatedEvent = z.infer<typeof UserCreatedEventSchema>;

// ─── auth.user.deactivated ───────────────────────────────────

/**
 * Usuário foi desativado.
 *
 * Consumer applications-service reatribui applications em triagem deste usuário.
 */
export const UserDeactivatedPayloadSchema = z.object({
  user_id: UserIdSchema,
  tenant_id: TenantIdSchema,
  deactivated_at: z.string().datetime({ offset: true }),
  reason: z.enum([
    'voluntary',
    'role_revoked',
    'security_incident',
    'data_breach',
  ]),
});

export const UserDeactivatedEventSchema = EventEnvelopeSchema(
  UserDeactivatedPayloadSchema,
);
export type UserDeactivatedPayload = z.infer<
  typeof UserDeactivatedPayloadSchema
>;
export type UserDeactivatedEvent = z.infer<typeof UserDeactivatedEventSchema>;
```

- [ ] **Step 4: Testes + lint + typecheck**

```bash
cd packages/contracts && pnpm test test/auth/events.test.ts && pnpm lint && pnpm typecheck && cd ../..
```

- [ ] **Step 5: Commit**

```bash
git add packages/contracts/src/auth/events.ts packages/contracts/test/auth/events.test.ts
git commit -s -m "$(cat <<'COMMIT'
feat(contracts): adicionar auth/events — 4 eventos auth.*

Eventos publicados pelo auth-service (a ser implementado em ciclo seguinte):

- auth.tenant.created — slug, name, plan (free/starter/pro/enterprise),
  created_at, created_by (sem email do operador).
- auth.tenant.deactivated — reason enum (contract_ended/data_breach/
  unpaid/manual); data_breach aciona protocolos LGPD.
- auth.user.created — user_id, tenant_id, roles (min 1), created_at.
  IMPORTANTE: NÃO inclui email/nome (PII L2). Consumer faz lookup
  autenticado se precisar.
- auth.user.deactivated — reason enum (voluntary/role_revoked/
  security_incident/data_breach).

Cada evento envolto via EventEnvelopeSchema. Payloads thin (apenas IDs +
o que mudou) conforme princípio em ADR-0004.

~25 testes Vitest cobrindo: cada payload válido, edge cases por campo,
todos os enum values, validação de length em strings.
COMMIT
)"
```

---

## Task 16: `packages/contracts/src/auth/http.ts` (TDD)

**Files:**

- Create: `packages/contracts/test/auth/http.test.ts`
- Create: `packages/contracts/src/auth/http.ts`

- [ ] **Step 1: Escrever testes**

`packages/contracts/test/auth/http.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import {
  LoginRequestSchema,
  LoginResponseSchema,
  MeResponseSchema,
  RefreshRequestSchema,
  RefreshResponseSchema,
} from '../../src/auth/http.js';

describe('LoginRequestSchema', () => {
  const valid = {
    email: 'user@example.com',
    password: 'super-secure-password-123',
    tenant_slug: 'sec-assistencia-sp',
  };

  it('aceita login válido', () => {
    expect(() => LoginRequestSchema.parse(valid)).not.toThrow();
  });

  it('rejeita email malformado', () => {
    expect(() =>
      LoginRequestSchema.parse({ ...valid, email: 'not-email' }),
    ).toThrow();
  });

  it('rejeita email > 254 chars (RFC 5321)', () => {
    const longEmail = 'a'.repeat(250) + '@b.c';
    expect(() =>
      LoginRequestSchema.parse({ ...valid, email: longEmail }),
    ).toThrow();
  });

  it('rejeita password < 12 chars', () => {
    expect(() =>
      LoginRequestSchema.parse({ ...valid, password: 'short' }),
    ).toThrow();
  });

  it('rejeita password > 256 chars (defesa DoS)', () => {
    expect(() =>
      LoginRequestSchema.parse({ ...valid, password: 'a'.repeat(257) }),
    ).toThrow();
  });

  it('aceita password com 12 chars exatos', () => {
    expect(() =>
      LoginRequestSchema.parse({ ...valid, password: 'aaaaaaaaaaaa' }),
    ).not.toThrow();
  });

  it('rejeita tenant_slug vazio', () => {
    expect(() =>
      LoginRequestSchema.parse({ ...valid, tenant_slug: '' }),
    ).toThrow();
  });

  it('rejeita tenant_slug > 64 chars', () => {
    expect(() =>
      LoginRequestSchema.parse({ ...valid, tenant_slug: 'x'.repeat(65) }),
    ).toThrow();
  });
});

describe('LoginResponseSchema', () => {
  const valid = {
    access_token: 'eyJ-token-payload',
    refresh_token: 'eyJ-refresh-token',
    expires_in: 900,
    token_type: 'Bearer' as const,
  };

  it('aceita response válido', () => {
    expect(() => LoginResponseSchema.parse(valid)).not.toThrow();
  });

  it('rejeita token_type diferente de Bearer', () => {
    expect(() =>
      LoginResponseSchema.parse({ ...valid, token_type: 'Basic' as never }),
    ).toThrow();
  });

  it('rejeita expires_in negativo', () => {
    expect(() =>
      LoginResponseSchema.parse({ ...valid, expires_in: -1 }),
    ).toThrow();
  });

  it('rejeita expires_in não-inteiro', () => {
    expect(() =>
      LoginResponseSchema.parse({ ...valid, expires_in: 100.5 }),
    ).toThrow();
  });
});

describe('RefreshRequestSchema', () => {
  it('aceita refresh válido', () => {
    expect(() =>
      RefreshRequestSchema.parse({ refresh_token: 'token' }),
    ).not.toThrow();
  });

  it('rejeita sem refresh_token', () => {
    expect(() => RefreshRequestSchema.parse({})).toThrow();
  });
});

describe('RefreshResponseSchema', () => {
  it('é estruturalmente compatível com LoginResponseSchema', () => {
    const valid = {
      access_token: 'a',
      refresh_token: 'r',
      expires_in: 900,
      token_type: 'Bearer' as const,
    };
    expect(() => RefreshResponseSchema.parse(valid)).not.toThrow();
  });
});

describe('MeResponseSchema', () => {
  const valid = {
    user: {
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Maria da Silva',
      email: 'maria@secretaria.sp.gov.br',
    },
    tenant: {
      tenant_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      slug: 'sec-assistencia-sp',
      name: 'Secretaria de Assistência Social',
    },
    roles: ['gestor', 'triagem'],
  };

  it('aceita response válido', () => {
    expect(() => MeResponseSchema.parse(valid)).not.toThrow();
  });

  it('email é OBRIGATÓRIO em MeResponse (LGPD Art. 18 II)', () => {
    const { email, ...userWithoutEmail } = valid.user;
    expect(() =>
      MeResponseSchema.parse({ ...valid, user: userWithoutEmail }),
    ).toThrow();
  });

  it('aceita roles vazio (usuário sem permissão ainda)', () => {
    expect(() => MeResponseSchema.parse({ ...valid, roles: [] })).not.toThrow();
  });

  it('rejeita email malformado', () => {
    expect(() =>
      MeResponseSchema.parse({
        ...valid,
        user: { ...valid.user, email: 'not-email' },
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Rodar — devem falhar**

```bash
cd packages/contracts && pnpm test test/auth/http.test.ts 2>&1 | tail -5
```

- [ ] **Step 3: Implementar `packages/contracts/src/auth/http.ts`**

```typescript
import { z } from 'zod';

import { TenantIdSchema, UserIdSchema } from '../shared/index.js';

/**
 * DTOs HTTP do auth-service.
 *
 * Mínimos para o primeiro release — apenas autenticação básica.
 * Tenants CRUD, Users CRUD, Roles management entram com a implementação
 * do auth-service no próximo ciclo.
 */

// ─── POST /auth/login ────────────────────────────────────────

export const LoginRequestSchema = z.object({
  /** Email RFC 5321 (max 254 chars). */
  email: z.string().email().max(254),

  /**
   * Senha entre 12 e 256 chars.
   * - Min 12: boa prática moderna (NIST SP 800-63B).
   * - Max 256: defesa DoS contra hash custoso de argon2id.
   */
  password: z.string().min(12).max(256),

  /** Slug do tenant onde o usuário se autentica. */
  tenant_slug: z.string().min(1).max(64),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  /** JWT short-lived (default 15min). */
  access_token: z.string(),

  /** Refresh token long-lived (default 7d), rotated em cada use. */
  refresh_token: z.string(),

  /** Tempo até expiração do access_token, em segundos. */
  expires_in: z.number().int().positive(),

  /** Único valor aceito: 'Bearer'. */
  token_type: z.literal('Bearer'),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// ─── POST /auth/refresh ──────────────────────────────────────

export const RefreshRequestSchema = z.object({
  refresh_token: z.string(),
});
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;

export const RefreshResponseSchema = LoginResponseSchema;
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;

// ─── GET /me ─────────────────────────────────────────────────

/**
 * Dados do próprio usuário autenticado.
 *
 * **LGPD Art. 18 II** — titular tem direito de acesso aos próprios dados.
 * Por isso este DTO inclui `email` (PII L2): o usuário está requisitando
 * seus próprios dados, é o caso autorizado.
 *
 * Outros endpoints que listam usuários (futuro `/tenants/:id/users`)
 * NÃO devem retornar email — apenas IDs + name redacted/short.
 */
export const MeResponseSchema = z.object({
  user: z.object({
    user_id: UserIdSchema,
    name: z.string().min(1),
    /** Autorizado LGPD Art. 18 II (acesso aos próprios dados). */
    email: z.string().email(),
  }),
  tenant: z.object({
    tenant_id: TenantIdSchema,
    slug: z.string().min(1),
    name: z.string().min(1),
  }),
  roles: z.array(z.string()),
});
export type MeResponse = z.infer<typeof MeResponseSchema>;
```

- [ ] **Step 4: Testes + lint + typecheck**

```bash
cd packages/contracts && pnpm test test/auth/http.test.ts && pnpm lint && pnpm typecheck && cd ../..
```

- [ ] **Step 5: Commit**

```bash
git add packages/contracts/src/auth/http.ts packages/contracts/test/auth/http.test.ts
git commit -s -m "$(cat <<'COMMIT'
feat(contracts): adicionar auth/http — 5 DTOs HTTP mínimos

Schemas mínimos para autenticação básica:

- LoginRequest — email (RFC 5321 max 254), password (12-256 chars,
  NIST SP 800-63B + DoS defense), tenant_slug.
- LoginResponse — access_token, refresh_token, expires_in,
  token_type literal 'Bearer'.
- RefreshRequest — só refresh_token.
- RefreshResponse — alias de LoginResponse.
- MeResponse — user{user_id, name, email}, tenant{tenant_id, slug, name},
  roles. Email INCLUÍDO aqui (LGPD Art. 18 II — direito de acesso aos
  próprios dados).

Outros endpoints listando users (futuro) NÃO devem retornar email.

~22 testes Vitest cobrindo: length min/max, email malformado, password
boundaries, token_type literal, refresh request shape, MeResponse email
obrigatório.
COMMIT
)"
```

---

## Task 17: `packages/contracts/src/auth/index.ts` + atualizar `src/index.ts`

**Files:**

- Create: `packages/contracts/src/auth/index.ts`
- Modify: `packages/contracts/src/index.ts`

- [ ] **Step 1: Criar `packages/contracts/src/auth/index.ts`**

```typescript
// @mais-inclusao/contracts/auth — schemas do bounded context auth (auth-service)

export * from './events.js';
export * from './http.js';
```

- [ ] **Step 2: Atualizar `packages/contracts/src/index.ts`**

```typescript
// @mais-inclusao/contracts — re-export flat para consumers
// Tree-shake friendly graças a sideEffects: false no package.json.

export * from './auth/index.js';
export * from './shared/index.js';
```

- [ ] **Step 3: Typecheck + lint + todos os testes**

```bash
cd packages/contracts && pnpm lint && pnpm typecheck && pnpm test && cd ../..
```

Expected: zero erros, ~85+ testes passam.

- [ ] **Step 4: Commit**

```bash
git add packages/contracts/src/auth/index.ts packages/contracts/src/index.ts
git commit -s -m "feat(contracts): adicionar src/auth/index.ts e atualizar src/index.ts para re-exportar auth"
```

---

## Task 18: `packages/contracts` — build via tsup

**Files:**

- Usar `packages/contracts/tsup.config.ts` (já criado na Task 8)
- Gerar `dist/`

- [ ] **Step 1: Build do package**

```bash
cd packages/contracts && pnpm build 2>&1 | tail -10
```

Expected: `CLI Build success` ou similar, sem erros. `dist/` populado.

- [ ] **Step 2: Verificar estrutura do `dist/`**

```bash
find packages/contracts/dist -type f | sort
```

Expected (saída aproximada):

```
packages/contracts/dist/auth/index.cjs
packages/contracts/dist/auth/index.cjs.map
packages/contracts/dist/auth/index.d.cts
packages/contracts/dist/auth/index.d.ts
packages/contracts/dist/auth/index.js
packages/contracts/dist/auth/index.js.map
packages/contracts/dist/index.cjs
packages/contracts/dist/index.cjs.map
packages/contracts/dist/index.d.cts
packages/contracts/dist/index.d.ts
packages/contracts/dist/index.js
packages/contracts/dist/index.js.map
packages/contracts/dist/shared/index.cjs
packages/contracts/dist/shared/index.cjs.map
packages/contracts/dist/shared/index.d.cts
packages/contracts/dist/shared/index.d.ts
packages/contracts/dist/shared/index.js
packages/contracts/dist/shared/index.js.map
```

- [ ] **Step 3: Verificar resolução de tipos no build**

```bash
node --input-type=module -e "
import('./packages/contracts/dist/shared/index.js').then(m => {
  console.log('TenantIdSchema exists:', typeof m.TenantIdSchema);
  console.log('EventEnvelopeSchema exists:', typeof m.EventEnvelopeSchema);
});
"
```

Expected:

```
TenantIdSchema exists: object
EventEnvelopeSchema exists: function
```

- [ ] **Step 4: Bundle size**

```bash
du -sh packages/contracts/dist/*
```

Expected: < 50KB por arquivo .js, < 200KB total.

- [ ] **Step 5: Verificar que `dist/` não vai para o commit**

```bash
git status --short | grep -E 'dist/' && echo "❌ dist/ staged" || echo "✅ dist/ ignored"
```

Expected: `✅ dist/ ignored` (.gitignore já tem `dist/`).

> Sem commit nesta task — `tsup.config.ts` já foi commitado na Task 8.

---

## Task 19: `packages/contracts` — snapshots JSON Schema

**Files:**

- Create: `packages/contracts/test/snapshots/schemas.test.ts`
- Create: `packages/contracts/test/snapshots/__snapshots__/schemas.test.ts.snap` (auto-gerado)

- [ ] **Step 1: Criar diretório e arquivo de teste**

```bash
mkdir -p packages/contracts/test/snapshots
```

Criar `packages/contracts/test/snapshots/schemas.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Importar todos os schemas via re-exports
import {
  LoginRequestSchema,
  LoginResponseSchema,
  MeResponseSchema,
  RefreshRequestSchema,
  TenantCreatedEventSchema,
  TenantDeactivatedEventSchema,
  UserCreatedEventSchema,
  UserDeactivatedEventSchema,
} from '../../src/auth/index.js';
import {
  ApplicationIdSchema,
  CitizenIdSchema,
  EventHeadersSchema,
  PaginationQuerySchema,
  ProblemDetailsSchema,
  ProgramIdSchema,
  TenantClaimSchema,
  TenantIdSchema,
  UserIdSchema,
} from '../../src/shared/index.js';

/**
 * Snapshot tests — golden master de JSON Schema gerado a partir de cada Zod.
 *
 * Se schema muda intencionalmente:
 *   pnpm test -u (ou -- --update-snapshots)
 *   Commit os snapshots atualizados JUNTO com Changeset declarando bump.
 *
 * Se snapshot quebra inesperadamente:
 *   Verificar se foi mudança não-intencional (regressão) ou intencional
 *   (esqueceu de atualizar snapshot).
 */

describe('Shared schemas — JSON Schema snapshots', () => {
  it('TenantIdSchema', () => {
    expect(zodToJsonSchema(TenantIdSchema, 'TenantId')).toMatchSnapshot();
  });
  it('UserIdSchema', () => {
    expect(zodToJsonSchema(UserIdSchema, 'UserId')).toMatchSnapshot();
  });
  it('ProgramIdSchema', () => {
    expect(zodToJsonSchema(ProgramIdSchema, 'ProgramId')).toMatchSnapshot();
  });
  it('CitizenIdSchema', () => {
    expect(zodToJsonSchema(CitizenIdSchema, 'CitizenId')).toMatchSnapshot();
  });
  it('ApplicationIdSchema', () => {
    expect(
      zodToJsonSchema(ApplicationIdSchema, 'ApplicationId'),
    ).toMatchSnapshot();
  });
  it('TenantClaimSchema', () => {
    expect(zodToJsonSchema(TenantClaimSchema, 'TenantClaim')).toMatchSnapshot();
  });
  it('EventHeadersSchema', () => {
    expect(
      zodToJsonSchema(EventHeadersSchema, 'EventHeaders'),
    ).toMatchSnapshot();
  });
  it('PaginationQuerySchema', () => {
    expect(
      zodToJsonSchema(PaginationQuerySchema, 'PaginationQuery'),
    ).toMatchSnapshot();
  });
  it('ProblemDetailsSchema', () => {
    expect(
      zodToJsonSchema(ProblemDetailsSchema, 'ProblemDetails'),
    ).toMatchSnapshot();
  });
});

describe('Auth schemas — JSON Schema snapshots', () => {
  it('TenantCreatedEventSchema', () => {
    expect(
      zodToJsonSchema(TenantCreatedEventSchema, 'TenantCreatedEvent'),
    ).toMatchSnapshot();
  });
  it('TenantDeactivatedEventSchema', () => {
    expect(
      zodToJsonSchema(TenantDeactivatedEventSchema, 'TenantDeactivatedEvent'),
    ).toMatchSnapshot();
  });
  it('UserCreatedEventSchema', () => {
    expect(
      zodToJsonSchema(UserCreatedEventSchema, 'UserCreatedEvent'),
    ).toMatchSnapshot();
  });
  it('UserDeactivatedEventSchema', () => {
    expect(
      zodToJsonSchema(UserDeactivatedEventSchema, 'UserDeactivatedEvent'),
    ).toMatchSnapshot();
  });
  it('LoginRequestSchema', () => {
    expect(
      zodToJsonSchema(LoginRequestSchema, 'LoginRequest'),
    ).toMatchSnapshot();
  });
  it('LoginResponseSchema', () => {
    expect(
      zodToJsonSchema(LoginResponseSchema, 'LoginResponse'),
    ).toMatchSnapshot();
  });
  it('RefreshRequestSchema', () => {
    expect(
      zodToJsonSchema(RefreshRequestSchema, 'RefreshRequest'),
    ).toMatchSnapshot();
  });
  it('MeResponseSchema', () => {
    expect(zodToJsonSchema(MeResponseSchema, 'MeResponse')).toMatchSnapshot();
  });
});
```

- [ ] **Step 2: Rodar para gerar snapshots iniciais**

```bash
cd packages/contracts && pnpm test test/snapshots/ 2>&1 | tail -10
```

Expected: todos passam (Vitest cria snapshots em primeira execução).

- [ ] **Step 3: Verificar arquivo de snapshots gerado**

```bash
ls -la packages/contracts/test/snapshots/__snapshots__/
head -30 packages/contracts/test/snapshots/__snapshots__/schemas.test.ts.snap
```

Expected: arquivo existe com JSON Schemas serializados.

- [ ] **Step 4: Rodar novamente para confirmar estabilidade**

```bash
cd packages/contracts && pnpm test test/snapshots/ 2>&1 | tail -5
```

Expected: todos passam (snapshots agora são comparados, não criados).

- [ ] **Step 5: Lint + typecheck**

```bash
cd packages/contracts && pnpm lint && pnpm typecheck && cd ../..
```

- [ ] **Step 6: Commit**

```bash
git add packages/contracts/test/snapshots/
git commit -s -m "$(cat <<'COMMIT'
test(contracts): adicionar snapshots JSON Schema como golden master

17 schemas snapshot-tested via zod-to-json-schema:
- Shared: TenantId, UserId, ProgramId, CitizenId, ApplicationId,
  TenantClaim, EventHeaders, PaginationQuery, ProblemDetails.
- Auth: 4 eventos (TenantCreated/Deactivated, UserCreated/Deactivated)
  + 4 DTOs HTTP (LoginRequest/Response, RefreshRequest, MeResponse).

Snapshots versionados em git como golden master:
- Mudança INTENCIONAL: rodar `pnpm test -u` + commit snapshots novos
  JUNTO com Changeset declarando bump (major se incompatível).
- Mudança NÃO-INTENCIONAL: snapshot quebra → CI falha → contribuidor
  é forçado a revisar e declarar bump apropriado.

Mecanismo é descrito em packages/contracts/README.md.
COMMIT
)"
```

---

## Task 20: `packages/contracts` — README

**Files:**

- Create: `packages/contracts/README.md`

- [ ] **Step 1: Criar README (via Write tool, conteúdo abaixo)**

Conteúdo de `packages/contracts/README.md`:

````markdown
# @mais-inclusao/contracts

Fronteira pública entre serviços e frontends do **+Inclusão**. Schemas Zod + tipos derivados, com runtime validation + type inference.

## Princípios não-negociáveis

1. **Thin events** — payload com apenas IDs + o que mudou. Consumer faz lookup se precisar.
2. **`tenant_id` obrigatório** em todo evento (defesa cross-tenant via header).
3. **Branded IDs** evitam confusão entre `UserId`, `TenantId`, `ProgramId`, etc.
4. **Sem PII em payload de evento** — emails, CPFs e similares ficam acessíveis via lookup autenticado, nunca em fila ou broker.
5. **Versionamento SemVer** — quebra de contrato = major bump + Changeset.

## Estrutura

```
packages/contracts/
├── src/
│   ├── shared/             # Universais (todos contextos)
│   │   ├── event-envelope.ts   # EventHeaders, EventEnvelope<T>
│   │   ├── tenant.ts            # TenantId, TenantClaim
│   │   ├── ids.ts               # UserId, ProgramId, CitizenId, ApplicationId
│   │   ├── pagination.ts        # PaginationQuery, PaginatedResult<T>
│   │   └── error.ts             # ProblemDetails RFC 9457
│   ├── auth/                # Contexto: autenticação e tenancy
│   │   ├── events.ts            # 4 eventos auth.*
│   │   └── http.ts              # 5 DTOs HTTP (Login, Refresh, Me)
│   └── index.ts             # Re-export flat
├── test/                    # Vitest unit
│   ├── shared/
│   ├── auth/
│   └── snapshots/           # JSON Schema golden master
└── dist/                    # Build (ESM+CJS+.d.ts via tsup)
```

## Como consumir

### Tree-shake friendly (recomendado)

```typescript
import {
  EventEnvelopeSchema,
  TenantIdSchema,
} from '@mais-inclusao/contracts/shared';
import {
  LoginRequestSchema,
  TenantCreatedEventSchema,
} from '@mais-inclusao/contracts/auth';
```

### Flat (importar tudo de um lugar)

```typescript
import {
  EventEnvelopeSchema,
  LoginRequestSchema,
  TenantIdSchema,
} from '@mais-inclusao/contracts';
```

## Padrão de evento

Todo evento publicado no NATS JetStream tem este shape:

```typescript
{
  headers: {
    event_id: '550e8400-...',           // UUID v4, vira NATS Msg-ID
    event_type: 'auth.tenant.created',  // <context>.<entity>.<event>
    event_version: '1.0.0',             // SemVer
    occurred_at: '2026-05-17T10:30:00Z',
    tenant_id: '6ba7b810-...',           // INVARIANTE
    correlation_id: '6ba7b811-...',
    causation_id: null,                  // ou UUID se houve causalidade
    producer: 'auth-service',
  },
  payload: {
    // shape específico do evento
  },
}
```

Construir schema de evento:

```typescript
import { z } from 'zod';
import { EventEnvelopeSchema } from '@mais-inclusao/contracts/shared';

const MeuPayloadSchema = z.object({ foo: z.string() });
const MeuEventoSchema = EventEnvelopeSchema(MeuPayloadSchema);

type MeuEvento = z.infer<typeof MeuEventoSchema>;
```

## Como adicionar novo bounded context

1. Criar `src/<contexto>/{http,events,index}.ts`.
2. Adicionar export ao `src/index.ts`.
3. Adicionar entrada no `exports` map do `package.json`.
4. Adicionar entry em `tsup.config.ts` (`entry`).
5. Escrever testes em `test/<contexto>/`.
6. Adicionar schemas ao snapshot test em `test/snapshots/schemas.test.ts`.
7. Rodar `pnpm test -u` para gerar snapshots iniciais.
8. Adicionar Changeset declarando `minor` (novo contexto = nova superfície aditiva).

## Como adicionar novo evento

1. Em `src/<contexto>/events.ts`, definir `PayloadSchema` + `EventSchema = EventEnvelopeSchema(PayloadSchema)`.
2. Exportar tipo via `z.infer`.
3. Adicionar testes em `test/<contexto>/events.test.ts`: payload válido, edge cases por campo, enum values.
4. Adicionar schema ao snapshot test.
5. Rodar `pnpm test -u`.
6. Changeset `minor`.

## Tabela de bump por mudança

| Mudança                                | Bump                 | Exemplo                                       |
| -------------------------------------- | -------------------- | --------------------------------------------- |
| Adicionar campo opcional em DTO        | `minor`              | `LoginRequest` ganha `remember_me?: boolean`  |
| Adicionar novo evento ou DTO           | `minor`              | Novo `auth.session.expired`                   |
| Adicionar novo contexto (`programs/`)  | `minor`              | Toda nova subdir                              |
| Bug fix em validação (sem mudar shape) | `patch`              | Regex de slug corrigida                       |
| Adicionar campo required               | `major`              | `EventHeaders` ganha `request_id` obrigatório |
| Remover campo                          | `major`              | `LoginResponse` perde `expires_in`            |
| Renomear campo                         | `major` em 2 versões | n: ambos; n+1: só novo                        |

## Snapshots JSON Schema

`test/snapshots/__snapshots__/` contém JSON Schema gerado de cada Zod schema. Versionado em git como **golden master**.

- **Mudança intencional**: `pnpm test -u` para regenerar, commit snapshots junto com Changeset.
- **Mudança não-intencional**: snapshot quebra → CI vermelho → contribuidor revisa.

## LGPD: nunca incluir PII em payload de evento

**Importante.** Email, CPF, telefone, endereço — nada disso vai em payload de evento. Apenas IDs.

Justificativa:

- Eventos vivem em NATS JetStream com retenção de dias.
- Replay tardio expõe PII em backlog.
- Consumer que precisa fazer lookup faz via API autenticada do producer.

A exceção é o DTO HTTP `MeResponse`, que retorna email do próprio usuário autenticado — autorizado por **LGPD Art. 18 II** (direito de acesso aos próprios dados). Endpoints que listam usuários para outros (futuro) não retornam email.

## Naming patterns

- **Event type**: `<context>.<entity>.<event>` em snake_case (e.g., `auth.tenant.created`).
- **Tipo TypeScript**: `PascalCaseEvent` ou `PascalCasePayload` (e.g., `TenantCreatedEvent`).
- **Arquivo**: `kebab-case.ts` (e.g., `event-envelope.ts`).
- **Schema exportado**: `PascalCaseSchema` (e.g., `TenantCreatedEventSchema`).

## Versionamento

Versão inicial: **0.1.0** (pre-alpha). Major bump para **1.0.0** quando primeiro tenant pagante existir.

Mudanças propagam por Changesets:

```bash
pnpm changeset
# escolher @mais-inclusao/contracts
# escolher bump (patch/minor/major)
# descrever em uma frase
```

## Como rodar localmente

```bash
pnpm install                      # da raiz do monorepo
cd packages/contracts

pnpm lint                         # ESLint
pnpm typecheck                    # tsc --noEmit em ambos tsconfigs
pnpm test                         # Vitest (~85+ testes)
pnpm test:coverage                # com cobertura V8 (alvo: ≥ 90% statements)
pnpm test -u                      # atualizar snapshots
pnpm build                        # gerar dist/ via tsup
```

## Referências

- [Spec do subprojeto](../../docs/superpowers/specs/2026-05-17-fundacao-1-configs-e-contracts-design.md)
- [ADR-0004 — NATS JetStream + Outbox](../../docs/adr/0004-nats-jetstream-outbox-pattern.md)
- [ADR-0005 — Multi-tenancy 6 camadas](../../docs/adr/0005-multi-tenancy-defesa-em-profundidade.md)
- [ADR-0008 — Conventional Commits + DCO + Changesets](../../docs/adr/0008-conventional-commits-dco-changesets.md)
- [ROPA](../../docs/legal/ropa.md)
- [CONTRIBUTING — checklist LGPD para PRs que tocam PII](../../CONTRIBUTING.md#cuidados-especiais-lgpd-e-pii)
````

- [ ] **Step 2: Verificar links**

```bash
grep -nE '\]\(\.\./' packages/contracts/README.md | head -10
```

Expected: links para ADRs, spec, ROPA, CONTRIBUTING. Validar que paths estão corretos.

- [ ] **Step 3: Commit**

```bash
git add packages/contracts/README.md
git commit -s -m "$(cat <<'COMMIT'
docs(contracts): documentar princípios, padrões e como contribuir

README cobrindo:
- 5 princípios não-negociáveis (thin events, tenant_id obrigatório,
  branded IDs, sem PII em eventos, SemVer com Changeset).
- Estrutura do package + como consumir (tree-shake vs flat).
- Padrão de evento com exemplo concreto.
- Passo-a-passo para adicionar novo bounded context.
- Passo-a-passo para adicionar novo evento.
- Tabela de bump por tipo de mudança.
- Snapshots JSON Schema (golden master, como atualizar).
- LGPD: nunca incluir PII em payload de evento + justificativa do
  caso autorizado (MeResponse via Art. 18 II).
- Naming patterns (event type, tipo TS, arquivo, schema export).
- Comandos locais (lint, typecheck, test, build).
- Referências cruzadas para ADRs, spec, ROPA, CONTRIBUTING.
COMMIT
)"
```

---

## Task 21: Verificação final + cobertura ≥ 90%

- [ ] **Step 1: Rodar suite completa com cobertura**

```bash
cd packages/contracts && pnpm test:coverage 2>&1 | tail -20
```

Expected:

- Todos os testes passam (~100 acumulados).
- Cobertura: statements ≥ 90%, branches ≥ 85%, functions ≥ 90%, lines ≥ 90%.

- [ ] **Step 2: Se cobertura < threshold, identificar gaps**

```bash
cat packages/contracts/coverage/coverage-summary.json 2>/dev/null | head -40
```

Adicionar testes para arquivos < 90%. Iterar até passar.

- [ ] **Step 3: Limpar `coverage/` (não versionar)**

```bash
ls packages/contracts/coverage/ 2>/dev/null && rm -rf packages/contracts/coverage/ || true
git status --short packages/contracts/ | grep coverage || echo "OK — coverage/ não staged"
```

Expected: `OK — coverage/ não staged` (já está no .gitignore).

- [ ] **Step 4: Build final**

```bash
cd packages/contracts && pnpm build 2>&1 | tail -5 && cd ../..
```

Expected: build success, dist atualizado.

- [ ] **Step 5: Rodar pipelines completas via Turbo (raiz)**

```bash
cd /home/luciano-douglas/www/mais-inclusao
pnpm lint 2>&1 | tail -5
pnpm typecheck 2>&1 | tail -5
pnpm test 2>&1 | tail -5
pnpm build 2>&1 | tail -5
```

Expected: cada comando termina sem erros. Turbo cache acelera re-runs.

- [ ] **Step 6: Commit (apenas se algum teste novo foi adicionado para cobertura)**

```bash
git status --short
```

Se houver alterações em `packages/contracts/test/`, commit:

```bash
git add packages/contracts/test/
git commit -s -m "test(contracts): aumentar cobertura para atingir thresholds 90/85/90/90"
```

Caso contrário, pular esta etapa.

---

## Task 22: Changeset + atualização CHANGELOG

**Files:**

- Create: `.changeset/<name>.md`
- (CHANGELOG raiz será atualizado pelo workflow Release quando PR for mergeado)

- [ ] **Step 1: Verificar Changesets inicializado**

```bash
ls -la .changeset/ 2>/dev/null
```

Se diretório não existir ou tiver apenas `.gitkeep`:

```bash
pnpm exec changeset init
```

Expected: cria `.changeset/config.json` com defaults.

- [ ] **Step 2: Configurar `.changeset/config.json`**

Se acabou de inicializar, ajustar para usar GitHub changelog (que linka PRs):

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.5/schema.json",
  "changelog": [
    "@changesets/changelog-github",
    { "repo": "olucianochagas/mais-inclusao" }
  ],
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

Instalar plugin:

```bash
pnpm add -DwR @changesets/changelog-github
```

- [ ] **Step 3: Criar changeset manualmente**

Criar arquivo `.changeset/fundacao-1-initial-release.md`:

```markdown
---
'@mais-inclusao/tsconfig': minor
'@mais-inclusao/eslint-config': minor
'@mais-inclusao/contracts': minor
---

Initial release of foundation packages of the +Inclusão monorepo:

- **@mais-inclusao/tsconfig**: 5 TypeScript config variants (base, nest, react, lib, test). Migrated `tsconfig.base.json` from root to this package.
- **@mais-inclusao/eslint-config**: ESLint 9 flat config with 4 presets (base, nest, react, lib). Strict typescript-eslint + import sorting + security plugins + jsx-a11y strict for React.
- **@mais-inclusao/contracts**: First release of the public contract boundary. Shared types (TenantId branded, IDs, EventEnvelope, Pagination, ProblemDetails RFC 9457) and `auth` context (4 events: tenant.created/deactivated, user.created/deactivated; 5 HTTP DTOs: Login/Refresh/Me). Snapshots of JSON Schema versioned as golden master.

Refs: docs/superpowers/specs/2026-05-17-fundacao-1-configs-e-contracts-design.md
```

- [ ] **Step 4: Verificar changeset**

```bash
ls .changeset/
cat .changeset/fundacao-1-initial-release.md
```

Expected: arquivo existe com conteúdo correto.

- [ ] **Step 5: Commit do changeset**

```bash
git add .changeset/
git commit -s -m "$(cat <<'COMMIT'
chore: adicionar changeset para release inicial dos packages de fundação

Bump minor para os 3 packages:
- @mais-inclusao/tsconfig: 5 variantes JSON
- @mais-inclusao/eslint-config: ESLint 9 flat config + 4 presets
- @mais-inclusao/contracts: shared types + auth events/DTOs + snapshots
COMMIT
)"
```

Expected: commit criado.

---

## Task 23: Verificação CI local + cross-check Definition of Done

- [ ] **Step 1: Simular CI completo localmente**

```bash
cd /home/luciano-douglas/www/mais-inclusao

echo "=== format check ===" && pnpm format:check 2>&1 | tail -3
echo "=== lint ===" && pnpm lint 2>&1 | tail -3
echo "=== typecheck ===" && pnpm typecheck 2>&1 | tail -3
echo "=== test ===" && pnpm test 2>&1 | tail -3
echo "=== build ===" && pnpm build 2>&1 | tail -3
```

Expected: cada bloco termina sem erros.

- [ ] **Step 2: Cross-check Definition of Done (15 critérios da spec)**

Verificar cada item:

```bash
# 1. 3 package.json com name, version, private, publishConfig, exports
for p in packages/tsconfig packages/eslint-config packages/contracts; do
  echo "--- $p/package.json ---"
  jq -r '{name, version, private, publishConfig, exports: (.exports|keys)}' "$p/package.json"
done

# 2. tsconfig com 5 variantes + README + migração base
ls packages/tsconfig/*.json packages/tsconfig/README.md

# 3. eslint-config com 4 arquivos em src/ + README
ls packages/eslint-config/src/ packages/eslint-config/README.md

# 4. contracts com shared/ (5 arquivos) + auth/ (2 arquivos) + index.ts
ls packages/contracts/src/shared/ packages/contracts/src/auth/ packages/contracts/src/index.ts

# 5. Cada package tem tsconfig.json estendendo @mais-inclusao/tsconfig/<variante>
for p in packages/tsconfig packages/eslint-config packages/contracts; do
  grep -h "extends" "$p/tsconfig.json" 2>/dev/null | head -2
done

# 6. eslint-config + contracts têm eslint.config.js
for p in packages/eslint-config packages/contracts; do
  test -f "$p/eslint.config.js" && echo "✅ $p/eslint.config.js" || echo "❌ $p/eslint.config.js"
done

# 7. contracts tem tsup + vitest config + dist/
ls packages/contracts/tsup.config.ts packages/contracts/vitest.config.ts packages/contracts/dist/

# 8. Testes cobrem todos schemas (≥ 1 válido + ≥ 1 inválido + 1 snapshot)
find packages/contracts/test -name "*.test.ts" | wc -l
ls packages/contracts/test/snapshots/__snapshots__/

# 9. Cobertura ≥ 90%
pnpm --filter @mais-inclusao/contracts test:coverage 2>&1 | grep -E "Statements|Lines"

# 10. pnpm install limpo
pnpm install --frozen-lockfile

# 11. lint + typecheck + test + build pass (cobertos no Step 1)

# 12. 3 READMEs
for p in packages/tsconfig packages/eslint-config packages/contracts; do
  test -f "$p/README.md" && echo "✅ $p/README.md ($(wc -l < $p/README.md) linhas)"
done

# 13. Changeset criado
ls .changeset/*.md | grep -v README

# 14. CHANGELOG raiz: será atualizado via release.yml ao mergear

# 15. README raiz aponta para packages/contracts/README.md
grep -n "packages/contracts" README.md
```

- [ ] **Step 3: Atualizar README raiz se faltar referência a packages/contracts/README.md**

```bash
grep -nE 'packages/contracts.*README' README.md
```

Se não houver, adicionar em "Como contribuir":

```markdown
**Antes de contribuir**, leia também:

- [Código de conduta](./CODE-OF-CONDUCT.md)
- [Política de segurança](./SECURITY.md)
- [Modelo de governança](./GOVERNANCE.md)
- [Padrões de contratos públicos](./packages/contracts/README.md) — se seu PR tocar `packages/contracts`.
```

Commit se modificado:

```bash
git add README.md
git commit -s -m "docs(readme): apontar para packages/contracts/README.md em 'Como contribuir'"
```

- [ ] **Step 4: Verificar histórico de commits da branch**

```bash
git log --oneline main..HEAD
```

Expected: ~22-25 commits atômicos.

- [ ] **Step 5: Verificar DCO em todos commits**

```bash
git log main..HEAD --format='%h %s' | while read sha msg; do
  if ! git log -1 "$sha" --format='%B' | grep -q 'Signed-off-by:'; then
    echo "❌ sem DCO: $sha — $msg"
  fi
done
echo "—fim—"
```

Expected: apenas `—fim—`. Se algum commit sem DCO, fazer rebase corretivo:

```bash
git rebase main --signoff
```

- [ ] **Step 6: Push da branch**

```bash
git push -u origin feat/fundacao-1-configs-contracts 2>&1 | tail -5
```

Expected: branch enviada.

- [ ] **Step 7: Verificação pós-push**

```bash
git status
git log --oneline -5
```

Expected: working tree clean; histórico mostra 22+ commits da branch.

---

## Apêndice — Comandos de troubleshooting

### Se `pnpm install` falha com `ERR_PNPM_CATALOG_ENTRY_NOT_FOUND`

Adicionar entry faltante em `pnpm-workspace.yaml` na seção `catalog:`. Exemplo:

```yaml
catalog:
  vitest: ^2.1.5
  '@vitest/coverage-v8': ^2.1.5
```

### Se Turborepo emite warnings sobre tasks não-encontradas

Esperado enquanto workspaces não declaram os scripts correspondentes. Cada workspace que precisa de uma task (ex: `db:generate`) declara em seu próprio `package.json`. Warnings somem conforme workspaces são criados.

### Se `tsup build` falha por type-only imports

Verificar que `verbatimModuleSyntax: true` está habilitado no `tsconfig.base.json` e que imports de tipo usam `import type` ou `import { type X }`.

### Se snapshot test detecta drift trivial (whitespace, ordem de keys)

`zod-to-json-schema` produz output determinístico. Se houver drift, verificar versão da dependência (mudança entre minor releases pode reordenar). Lockfile pin garante reprodutibilidade.

### Se `pnpm test:coverage` reporta abaixo de 90%

Identificar arquivos com baixa cobertura via output de `text` reporter. Adicionar testes que exercitem caminhos não-cobertos. Em schemas Zod, caminhos comuns esquecidos são: `optional` chains, `default` values, `nullable`, regex edge cases.

### Se ESLint reporta `Parsing error: ESLint was configured to run...` em arquivo config

Adicionar arquivo ao `allowDefaultProject` em `parserOptions.projectService` do preset base.

---

## Self-Review (executado pelo plan writer antes de entregar)

**1. Spec coverage:** Cada seção da spec mapeada para tasks?

| Spec                                | Task(s)                                              |
| ----------------------------------- | ---------------------------------------------------- |
| § 2 — `packages/tsconfig`           | Tasks 2, 3, 4                                        |
| § 3 — `packages/eslint-config`      | Tasks 5, 6, 7                                        |
| § 4 — `packages/contracts` (shared) | Tasks 8, 9, 10, 11, 12, 13, 14                       |
| § 4 — `packages/contracts` (auth)   | Tasks 15, 16, 17                                     |
| § 5 — Build (tsup)                  | Task 18                                              |
| § 5 — Testes (Vitest + snapshots)   | Tasks 9-17 (testes inline TDD) + Task 19 (snapshots) |
| § 5 — Integração CI/Changesets      | Tasks 22, 23                                         |
| Definition of Done — 15 itens       | Cross-check em Task 23                               |
| Riscos (6)                          | Apêndice de troubleshooting cobre os principais      |

Cobertura: 100% das seções da spec.

**2. Placeholder scan:** Buscar TBD, "implement later", "add appropriate", "similar to":

- Nenhum encontrado. Todos os snippets de código têm conteúdo completo.

**3. Type consistency:** Mesma nomenclatura ao longo das tasks?

- `TenantIdSchema`, `EventEnvelopeSchema`, `LoginRequestSchema` consistentes.
- Filenames consistentes (`tenant.ts`, `event-envelope.ts`, etc.).
- Tipos `TenantId`, `EventHeaders`, etc. consistentes entre testes e implementação.

Tudo verificado.

---

## Execution Handoff

**Plano completo e salvo em `docs/superpowers/plans/2026-05-17-fundacao-1-configs-e-contracts-plan.md`.**

Duas opções de execução:

**1. Subagent-Driven (recomendado)** — Dispatch de subagent novo por task, com revisão entre tasks, iteração rápida. Usa `superpowers:subagent-driven-development`.

**2. Inline Execution** — Execução das tasks na sessão atual usando `superpowers:executing-plans`, com checkpoints para revisão.

**Qual abordagem?**
