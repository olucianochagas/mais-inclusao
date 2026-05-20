import nestConfig from '@mais-inclusao/eslint-config/nest';

export default [
  ...nestConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: ['dist/**', '**/*.d.ts', 'coverage/**', 'prisma/migrations/**'],
  },
];
