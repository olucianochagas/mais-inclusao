# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato segue [Keep a Changelog 1.1.0](https://keepachangelog.com/pt-BR/1.1.0/), e este projeto adere ao [Semantic Versioning 2.0.0](https://semver.org/lang/pt-BR/spec/v2.0.0.html).

Entradas neste arquivo são geradas por meio de [Changesets](https://github.com/changesets/changesets). Não edite manualmente exceto em casos excepcionais (correção de typo, etc.).

---

## [Unreleased]

### Added

#### Especificação e documentação técnica
- **Spec consolidada de decomposição** do programa em `docs/superpowers/specs/2026-05-16-programa-mais-inclusao-decomposicao.md` (22 bounded contexts + 4 unidades transversais, 3 ondas evolutivas).
- **10 ADRs (Architecture Decision Records)** em `docs/adr/` formato MADR:
  - ADR-0001 — Microsserviços evolutivos por bounded context
  - ADR-0002 — Module Federation 2.0 + Rspack para frontends
  - ADR-0003 — Monorepo Turborepo + pnpm 11.1.2
  - ADR-0004 — Mensageria NATS JetStream + Outbox Pattern
  - ADR-0005 — Multi-tenancy com 6 camadas de defesa em profundidade
  - ADR-0006 — Criptografia de PII em coluna com KEK por tenant
  - ADR-0007 — WCAG 2.2 AA como Definition of Done
  - ADR-0008 — Conventional Commits + DCO + Changesets
  - ADR-0009 — BDFL transitório como modelo de governança inicial
  - ADR-0010 — Ambiente de desenvolvimento containerizado integralmente
- ADR template (`0000-template.md`) e README/índice de ADRs.

#### Documentação de comunidade open source
- `README.md` — visão, missão, valores, persona, stack, **diagramas Mermaid** (topologia + saga de inscrição), 40+ shields oficiais Shields.io.
- `CODE-OF-CONDUCT.md` — Contributor Covenant 2.1 estendido com 5 compromissos adicionais de inclusão.
- `CONTRIBUTING.md` — guia completo (setup, workflow Git, DCO, Conventional Commits, checklists LGPD/a11y).
- `SECURITY.md` — política de divulgação responsável com safe harbor + distinção entre vuln técnica e incidente LGPD.
- `GOVERNANCE.md` — modelo BDFL transitório com path explícito para comunidade.
- `MAINTAINERS.md`, `SUPPORT.md`.
- `.github/`:
  - Issue templates YAML (`bug_report`, `feature_request`, `accessibility_issue`, `security_vulnerability`, `config`).
  - `PULL_REQUEST_TEMPLATE.md` com checklists colapsáveis condicionais (a11y, LGPD, segurança).
  - `CODEOWNERS` com áreas mapeadas ao monorepo.
  - `FUNDING.yml` placeholder comentado.

#### Documentação legal (LGPD)
- `docs/legal/ropa.md` — Registro de Operações de Tratamento (Art. 37 LGPD) com 10 operações declaradas.
- `docs/legal/dpa-template.md` — Template de Data Processing Agreement.
- `docs/legal/subprocessors.md` — Lista pública de sub-operadores.

#### Configuração de monorepo e tooling
- `turbo.json` com 14 pipelines declarados (`build`, `dev`, `lint`, `typecheck`, `test`, `test:integration`, `e2e`, `db:migrate`, `db:generate`, `contracts:codegen`, `format`, `format:check`, `seed`, `clean`), com `globalDependencies`, `globalEnv`, `globalPassThroughEnv` e `remoteCache`.
- `pnpm-workspace.yaml` com **catálogo de versões** centralizado para Onda 1 (NestJS 11, Prisma 6, React 19, Rspack 1.x, Tailwind 4, Vitest, Playwright, axe-core) e **`onlyBuiltDependencies`** allow-list (defesa supply chain).
- `tsconfig.base.json` strict (com `noUncheckedIndexedAccess`, `isolatedModules`, `verbatimModuleSyntax`).
- `commitlint.config.cjs` com tipos estendidos `a11y` e `security`, escopos alinhados ao monorepo.
- `package.json` raiz com 20+ scripts (`dev`, `build`, `test`, `infra:up`, `db:migrate`, `changeset`, etc.) e devDependencies base (Changesets, Husky, lint-staged, commitlint, Prettier, syncpack, rimraf, TypeScript, Turborepo).

#### Workflows GitHub Actions
- `.github/workflows/ci.yml` — preflight (lint, format, typecheck) → testes unit → testes integration (condicional) → build → gate.
- `.github/workflows/codeql.yml` — SAST com `security-extended` + `security-and-quality` queries, agendado semanalmente.
- `.github/workflows/dco.yml` — valida `Signed-off-by:` em todos os commits do PR.
- `.github/workflows/commitlint.yml` — valida título do PR + cada commit individualmente.
- `.github/workflows/e2e.yml` — Playwright + axe-core, condicional a label.
- `.github/workflows/release.yml` — Changesets (Version PR + publish + tags + GitHub Releases).
- `.github/workflows/pr-labeler.yml` — atribuição automática de labels por path.
- `.github/workflows/stale.yml` — gestão de inatividade com SLA-friendly exempt labels.
- `.github/labeler.yml` — config de 25+ labels mapeadas a paths do monorepo.
- `.github/dependabot.yml` — npm/pnpm + github-actions com agrupamento de minor/patch.

### Changed
- **`package.json`**: campo `packageManager` migrado de `npm@11.12.1` para `pnpm@11.1.2`. Campo `workspaces` removido (pnpm usa `pnpm-workspace.yaml`). Adicionados 20+ scripts e devDependencies base.
- **`README.md`**: diagramas ASCII substituídos por **Mermaid** (renderização nativa no GitHub) — topologia da Onda 1 com classDef coloridos e sequence diagram da saga de inscrição.
- **`turbo.json`**: substituído stub (`$schema` apenas) por configuração completa com 14 tasks.
- **`pnpm-workspace.yaml`**: estendido com `catalog:` (versionamento centralizado de deps Onda 1) e `onlyBuiltDependencies` (allow-list para scripts postinstall).

### Removed
- `package-lock.json` (substituído por `pnpm-lock.yaml`).
- `node_modules` legado (regenerado pelo pnpm).

### Security
- Documentada política de divulgação responsável com safe harbor explícito para pesquisadores éticos.
- Documentada postura LGPD operacional: ROPA versionado, DPA por tenant, criptografia de PII em coluna com KEK por tenant.
- Workflow CodeQL ativo com queries security-extended.
- `onlyBuiltDependencies` em `pnpm-workspace.yaml` bloqueia scripts postinstall não-listados (mitigação supply chain).
- Dependabot configurado para detectar CVEs em npm e GitHub Actions.

---

## [0.0.0] — 2026-05-16

### Added
- Inicialização do repositório Git (sem commits anteriores).
- Estrutura mínima de monorepo: `apps/`, `packages/`, `docs/` (vazios, apenas `.gitkeep`).
- `package.json` raiz com declaração de workspaces (`apps/*`, `packages/*`) e `turbo@^2.9.14` como devDependency.
- Licença ISC.
- Esboços iniciais (vazios) de `README.md`, `CONTRIBUTING.md`, `CODE-OF-CONDUCT.md`.

---

## Convenções deste changelog

### Categorias

- **Added** — para novas funcionalidades.
- **Changed** — para mudanças em funcionalidades existentes.
- **Deprecated** — para funcionalidades que serão removidas em breve.
- **Removed** — para funcionalidades removidas nesta versão.
- **Fixed** — para correções de bugs.
- **Security** — para correções relacionadas a vulnerabilidades.

### Como adicionar uma entrada

1. Durante o desenvolvimento, execute `pnpm changeset` na raiz do monorepo.
2. Escolha quais workspaces foram afetados.
3. Escolha o bump de versão: `patch`, `minor`, `major`.
4. Descreva a mudança em uma frase clara.
5. Commit o arquivo gerado em `.changeset/`.
6. O changeset é consolidado neste CHANGELOG no release.

### Breaking changes

Mudanças que quebram contrato de API ou eventos em `packages/contracts` exigem:

- Bump de versão **major** do pacote afetado.
- Seção `Changed` ou `Removed` no CHANGELOG com detalhamento.
- Path de migração documentado (link para guia em `docs/migration/`).
- Revisão dupla de PR (ver [CODEOWNERS](./.github/CODEOWNERS)).

---

[Unreleased]: https://github.com/olucianochagas/mais-inclusao/compare/v0.0.0...HEAD
[0.0.0]: https://github.com/olucianochagas/mais-inclusao/releases/tag/v0.0.0
