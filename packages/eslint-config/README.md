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

## Self-lint deste package

O `eslint.config.js` desta lib usa **config minimal** (sem type-aware), não o próprio preset, para evitar dependência em `@types/node` / `vitest` só para validar JS de configuração. O preset completo é para consumers TypeScript.
