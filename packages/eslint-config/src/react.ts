// @mais-inclusao/eslint-config/react — preset para apps frontend MF
//
// eslint-plugin-jsx-a11y, eslint-plugin-react, eslint-plugin-react-hooks
// publicam types parciais que conflitam com o shape esperado por
// `tseslint.config()`. Usamos `as never` cast nas atribuições para preservar
// type safety nos rules e contornar incompatibilidade estrutural.

import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { base } from './index.js';

const reactConfig: ReturnType<typeof tseslint.config> = [
  ...base,
  {
    files: ['**/*.{ts,tsx,jsx}'],
    plugins: {
      react: react as never,
      'react-hooks': reactHooks as never,
      'jsx-a11y': jsxA11y as never,
    },
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...((react as unknown) as {
        configs: {
          recommended: { rules: Record<string, unknown> };
          'jsx-runtime': { rules: Record<string, unknown> };
        };
      }).configs.recommended.rules,
      ...((react as unknown) as {
        configs: { 'jsx-runtime': { rules: Record<string, unknown> } };
      }).configs['jsx-runtime'].rules,
      ...((reactHooks as unknown) as {
        configs: { recommended: { rules: Record<string, unknown> } };
      }).configs.recommended.rules,
      ...((jsxA11y as unknown) as {
        configs: { strict: { rules: Record<string, unknown> } };
      }).configs.strict.rules,

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

export default reactConfig;
