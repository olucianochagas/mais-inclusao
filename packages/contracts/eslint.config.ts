import libConfig from '@mais-inclusao/eslint-config/lib';

export default [
  ...libConfig,
  {
    ignores: ['dist/**', '__snapshots__/**', '**/*.d.ts', 'coverage/**'],
  },
];
