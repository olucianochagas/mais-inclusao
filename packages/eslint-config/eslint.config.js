// Self-lint deste próprio package.
//
// Usa config minimal (sem type-aware) porque este package é JS-only
// e queremos evitar dependência em vitest/node types só para self-lint.
// O preset completo (src/index.js) é para consumers TypeScript.

import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import security from 'eslint-plugin-security';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    plugins: {
      import: importPlugin,
      'simple-import-sort': simpleImportSort,
      security,
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
  { ignores: ['node_modules/**', 'dist/**'] },
];
