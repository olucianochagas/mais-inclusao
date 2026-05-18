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

`experimentalDecorators` e `emitDecoratorMetadata` ficam restritos a
`nest.json`. Packages de biblioteca não devem carregar metadata de decorators,
evitando warnings do `tsup` e dependência desnecessária de `@swc/core`.

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

## Como funciona o `extends` em monorepo

O pnpm cria symlink em `node_modules/@mais-inclusao/tsconfig` apontando para `packages/tsconfig`. TypeScript 5.0+ resolve o `extends` via `exports` map deste `package.json`. **Importante**: o workspace que consome precisa declarar `@mais-inclusao/tsconfig` como `devDependency` (`"workspace:*"`).

Para a raiz do monorepo, isso já está feito (ver `package.json` raiz).
