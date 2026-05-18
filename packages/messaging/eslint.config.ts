import libConfig from '@mais-inclusao/eslint-config/lib';

export default [
  ...libConfig,
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        projectService: false,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: ['dist/**', 'coverage/**'],
  },
];
