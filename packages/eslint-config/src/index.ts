// @mais-inclusao/eslint-config — preset base
//
// Importado por nest.ts, react.ts e lib.ts. Pode ser consumido direto
// via `import config from '@mais-inclusao/eslint-config'` quando workspace
// não se encaixa nas 3 categorias específicas.
//
// Ambient declarations dos plugins sem types publicados ficam em
// `src/types/eslint-plugins.d.ts` — incluídos automaticamente pelo
// tsconfig.json via `include: ["src/**/*"]`.

import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import security from 'eslint-plugin-security';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

/**
 * Configuração base: TypeScript strict + organização de imports + segurança.
 *
 * Retorno tipado via `ReturnType<typeof tseslint.config>` (alias para `Linter.Config[]`).
 */
export const base = defineConfig(
  js.configs.recommended,

  // typescript-eslint v8 strict + stylistic com type checking
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    plugins: {
      import: importPlugin as never,
      'simple-import-sort': simpleImportSort as never,
      security: security as never,
    },
    languageOptions: {
      parserOptions: {
        // Type-aware linting sem listar tsconfigs manualmente.
        // `allowDefaultProject` cobre configs na raiz do workspace consumer;
        // arquivos `src/**` devem ser cobertos pelo tsconfig do consumer.
        projectService: {
          allowDefaultProject: ['eslint.config.ts', '*.config.{js,ts,mjs,cjs}'],
        },
        // `process.cwd()` é portable entre Node 20+ sem precisar de lib ES2024.
        tsconfigRootDir: process.cwd(),
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
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
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
      'src/index.ts',
      'src/nest.ts',
      'src/react.ts',
      'src/lib.ts',
    ],
    rules: {
      'import/no-default-export': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);

export default base;
