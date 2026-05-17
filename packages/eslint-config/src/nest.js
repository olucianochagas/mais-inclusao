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
