# ADR-0008: Conventional Commits + DCO + Changesets para versionamento e rastreabilidade

- **Status:** accepted
- **Data:** 2026-05-16
- **Decisores:** @olucianochagas
- **Tags:** governanca, tooling, releases, fundacional

---

## Contexto

O +Inclusão é projeto open source que aceita contribuições externas. Em monorepo com múltiplos pacotes que evoluem em ritmos diferentes (especialmente `packages/contracts` que é shared entre todos os serviços), é crítico:

- **Rastrear de forma estruturada** o tipo de cada mudança (feat, fix, breaking) → vira automação (CHANGELOG, semver).
- **Proteger o projeto** contra contribuições com licença ambígua ou copyleft incompatível.
- **Versionar pacotes internos** de forma que cada release seja explícito e revisado.

Pergunta concreta: **que combinação de práticas adotar para versionamento, licenciamento de contribuições, e changelog?**

## Decisão

Adotar **três práticas combinadas**, com automação:

### 1. Conventional Commits 1.0.0

Estrutura padrão:

```
<tipo>(<escopo opcional>): <descrição curta no imperativo>

<corpo opcional>

<rodapés opcionais>
```

**Tipos**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`, mais **`a11y`** e **`security`** (extensões +Inclusão).

**Validado por**:
- `commitlint` em **pre-commit hook** (Husky) — bloqueia commits malformados localmente.
- **Workflow CI** que valida o **título do PR** (que vira mensagem do squash merge).

### 2. Developer Certificate of Origin (DCO) — Sign-off

Cada commit precisa de linha `Signed-off-by:` ao final, adicionada via `git commit -s`.

Significado: o contribuidor declara que **tem o direito** de contribuir o código e concorda em distribuí-lo sob a licença do projeto ([ISC](../../LICENSE)).

Modelo do Linux Kernel. Leve, sem contrato a assinar (CLA).

**Validado por**: workflow CI `dco.yml` que checa todos os commits do PR.

### 3. Changesets para versionamento

Cada PR que muda API/contrato/comportamento público requer um **changeset**:

```bash
pnpm changeset
```

Cria arquivo em `.changeset/` declarando:
- Quais pacotes são afetados
- Tipo de bump (`major`, `minor`, `patch`)
- Descrição da mudança

**Releases** são feitas pelo workflow `release.yml` que:
1. Cria PR de "Version Packages" consolidando changesets.
2. Ao mergear, publica pacotes, gera tags, e atualiza `CHANGELOG.md`.

## Consequências

### Positivas

- **CHANGELOG gerado automaticamente** seguindo Keep a Changelog 1.1. Não há mais "esqueci de atualizar o changelog".
- **Semver respeitado**: changesets força declaração explícita de major/minor/patch — quebras de contrato em `packages/contracts` não passam silenciosamente.
- **Rastreabilidade**: cada commit comunica intenção. `git log --grep="feat(applications):"` retorna histórico filtrado.
- **DCO sem fricção legal**: contribuidores não precisam assinar contrato; basta `git commit -s`. Linux Kernel valida há 20+ anos.
- **CI bloqueia PRs malformados** antes de revisão humana — eleva qualidade média de PRs sem custo de revisor.
- **Convenções escopadas ao projeto**: tipos `a11y` e `security` (extensões) sinalizam áreas críticas e disparam revisão dedicada via CODEOWNERS.

### Negativas

- **Curva de aprendizado**: contribuidores novos precisam aprender Conventional Commits + DCO + Changesets. Mitigação: CONTRIBUTING.md detalhado com exemplos; Commitizen (`cz`) ajuda na composição.
- **Husky pode falhar silenciosamente** em ambientes sem suporte a hooks (alguns IDEs, Windows + WSL com bind mounts). Mitigação: workflow CI redundante como safety net.
- **Pre-commit hooks atrasam commit** em alguns segundos. Tradeoff vs qualidade.
- **Changesets adiciona um passo** que contribuidores esquecem com frequência. Mitigação: workflow que lembra no PR ("changeset missing, please run `pnpm changeset`").

### Neutras

- **CLA escolhido seria mais forte legalmente**, mas DCO é suficiente para projeto sob licença permissiva (ISC).

## Alternativas consideradas

### Alternativa A — CLA (Contributor License Agreement) em vez de DCO

**Resumo**: Cada contribuidor assina contrato explícito (via CLA Assistant ou similar).

**Por que rejeitada**:
- Adiciona barreira legal que **filtra contribuição casual** — exatamente o tipo de contribuidor que esperamos atrair (pessoas com vivência, em começo de carreira, com tempo limitado).
- Para projeto sob ISC (permissiva), CLA não adiciona proteção real sobre DCO.
- Modelo Linux Kernel funciona há 20+ anos com DCO em ecosistema gigantesco — provou-se suficiente.

### Alternativa B — Sem convenção de commits / Changelog manual

**Resumo**: Cada commit livre, CHANGELOG editado à mão.

**Por que rejeitada**:
- Esquecimentos são certos. CHANGELOG vira inconsistente, perde valor.
- Sem disciplina de commit, o `git log` deixa de ser ferramenta de exploração.
- Releases viram manuais e propensas a erro humano.

### Alternativa C — Semantic Release (versionamento totalmente automático)

**Resumo**: Mensagem de commit decide bump automaticamente, sem changeset.

**Por que rejeitada**:
- Em monorepo com múltiplos pacotes de ritmos diferentes, semantic-release é menos flexível que Changesets.
- Quem contribui pode não saber distinguir minor de major sem revisar — Changesets força a declaração explícita.

### Alternativa D — Versionamento manual com semver

**Resumo**: Mantenedor bumps versões e edita CHANGELOG manualmente.

**Por que rejeitada**:
- Não escala em monorepo com 20+ pacotes.
- Custo de release alto desencoraja releases frequentes.

## Referências

- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/)
- [Developer Certificate of Origin v1.1](https://developercertificate.org/)
- [Changesets — GitHub](https://github.com/changesets/changesets)
- [Keep a Changelog 1.1](https://keepachangelog.com/en/1.1.0/)
- [Husky](https://typicode.github.io/husky/) — git hooks
- [commitlint](https://commitlint.js.org/)
- [CONTRIBUTING.md — Padrões de commit](../../CONTRIBUTING.md#padrões-de-commit-conventional-commits--dco)
