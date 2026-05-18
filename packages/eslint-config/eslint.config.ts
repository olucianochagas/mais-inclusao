// Self-lint deste próprio package.
//
// Usa config minimal sem type-aware (evita dependência circular).
// O preset completo (src/index.ts) é para consumers TypeScript.

import js from '@eslint/js';
import type { Linter } from 'eslint';
import importPlugin from 'eslint-plugin-import';
import security from 'eslint-plugin-security';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const config: Linter.Config[] = [
  js.configs.recommended,
  {
    files: ['src/**/*.ts', 'eslint.config.ts', 'tsup.config.ts'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parser: tseslint.parser,
      globals: { ...globals.node },
    },
    plugins: {
      import: importPlugin as never,
      'simple-import-sort': simpleImportSort as never,
      security: security as never,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/no-duplicates': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-non-literal-regexp': 'error',
      'no-debugger': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
    },
  },
  { ignores: ['node_modules/**', 'dist/**', '**/*.d.ts'] },
];

export default config;
