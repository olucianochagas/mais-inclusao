// @mais-inclusao/eslint-config/lib — preset para packages publicáveis

import tseslint from 'typescript-eslint';

import { base } from './index.js';

const libConfig: ReturnType<typeof tseslint.config> = [
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

export default libConfig;
