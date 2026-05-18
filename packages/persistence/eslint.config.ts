import libConfig from '@mais-inclusao/eslint-config/lib';

export default [
  ...libConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: ['./tsconfig.json', './tsconfig.test.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: ['dist/**', 'coverage/**', '**/*.d.ts'],
  },
];
