/**
 * Commitlint — validação de Conventional Commits.
 *
 * Aplicado em:
 *  - PRs (CI): `.github/workflows/commitlint.yml` valida o título do PR
 *    (que vira a mensagem de squash merge).
 *  - Local (husky): hook `commit-msg` valida cada commit antes de criar.
 *
 * Convenção: https://www.conventionalcommits.org/en/v1.0.0/
 * Tipos adicionais do +Inclusão: `a11y` (acessibilidade) e `security`.
 */

/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],

  rules: {
    'type-enum': [
      2,
      'always',
      [
        // Padrão Conventional Commits
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
        // Extensões do +Inclusão
        'a11y',
        'security',
      ],
    ],

    // Escopos alinhados a apps/packages/tools do monorepo (mais "lgpd" como cross-cutting)
    'scope-enum': [
      1, // warning, não error — permite escopos novos sem bloquear
      'always',
      [
        // Apps
        'shell',
        'gestor-mf',
        'cidadao-mf',
        'bff-gestor',
        'bff-cidadao',
        'auth-service',
        'programs-service',
        'citizens-service',
        'applications-service',
        // Packages
        'ui',
        'auth-react',
        'contracts',
        'persistence',
        'messaging',
        'audit',
        'observability',
        'testing',
        'eslint-config',
        'tsconfig',
        'tailwind-config',
        // Tools
        'cli',
        'codegen',
        // Cross-cutting
        'infra',
        'docker',
        'k8s',
        'docs',
        'adr',
        'github',
        'workflows',
        'release',
        'deps',
        'lgpd',
        'a11y',
      ],
    ],

    'header-max-length': [2, 'always', 100],
    'header-min-length': [2, 'always', 10],
    'subject-case': [
      2,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
    ],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'kebab-case'],
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [1, 'always', 100],
    'footer-leading-blank': [2, 'always'],
    'footer-max-line-length': [1, 'always', 100],
  },

  helpUrl:
    'https://github.com/olucianochagas/mais-inclusao/blob/main/CONTRIBUTING.md#padrões-de-commit-conventional-commits--dco',

  prompt: {
    questions: {
      type: {
        description: 'Tipo de mudança',
        enum: {
          feat: { description: 'Nova funcionalidade visível ao usuário' },
          fix: { description: 'Correção de bug' },
          docs: { description: 'Apenas documentação' },
          a11y: { description: 'Mudanças de acessibilidade' },
          security: { description: 'Mudanças de segurança' },
          refactor: { description: 'Refactor sem mudança externa' },
          perf: { description: 'Melhoria de performance' },
          test: { description: 'Adicionar/ajustar testes' },
          build: { description: 'Build, deps, scripts' },
          ci: { description: 'GitHub Actions, workflows' },
          chore: { description: 'Manutenção que não cai em outras' },
          style: { description: 'Formatação, sem mudança lógica' },
          revert: { description: 'Reversão de commit' },
        },
      },
    },
  },
};
