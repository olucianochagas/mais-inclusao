# Guia de Contribuição — +Inclusão

> Obrigado por considerar contribuir com o **+Inclusão**! Este projeto existe para ampliar acesso a direitos sociais por meio de tecnologia, e ele só vai conseguir cumprir essa missão com a participação de pessoas com diferentes saberes — programação, design, acessibilidade, direito, política pública, vivência cidadã. **Tem espaço para você.**

Antes de tudo, leia também o **[Código de Conduta](./CODE-OF-CONDUCT.md)** — ele se aplica em todos os espaços do projeto.

---

## Sumário

- [Estado atual do projeto](#estado-atual-do-projeto)
- [Maneiras de contribuir](#maneiras-de-contribuir)
- [Antes de começar](#antes-de-começar)
- [Setup do ambiente de desenvolvimento](#setup-do-ambiente-de-desenvolvimento)
- [Fluxo de trabalho Git](#fluxo-de-trabalho-git)
- [Padrões de commit (Conventional Commits + DCO)](#padrões-de-commit-conventional-commits--dco)
- [Padrões de código](#padrões-de-código)
- [Testes](#testes)
- [Documentação](#documentação)
- [Cuidados especiais: LGPD e PII](#cuidados-especiais-lgpd-e-pii)
- [Cuidados especiais: Acessibilidade](#cuidados-especiais-acessibilidade)
- [Pull Requests](#pull-requests)
- [Processo de revisão](#processo-de-revisão)
- [Quem revisa o quê](#quem-revisa-o-quê)
- [Reconhecimento](#reconhecimento)
- [Em caso de dúvida](#em-caso-de-dúvida)

---

## Estado atual do projeto

**Pre-alpha** — Maio de 2026. O que isso significa para você:

| Você quer contribuir com... | Status no projeto |
|---|---|
| **Documentação, glossário, traduções** | ✅ Pode contribuir agora |
| **Discussão de design, UX, fluxos do cidadão** | ✅ Pode contribuir agora (issues/discussions) |
| **Testes de acessibilidade do conceito atual** | ✅ Pode contribuir agora |
| **Brainstorming de subprojetos da Onda 1** | ✅ Pode contribuir agora |
| **Código dos serviços (auth, programs, citizens, applications)** | 🚧 Requer subprojeto correspondente já em ciclo de implementação |
| **Frontend dos remotes (gestor-mf, cidadao-mf)** | 🚧 Requer scaffolding inicial |
| **Infraestrutura, Docker, IaC** | 🚧 Requer scaffolding inicial |

Acompanhe os subprojetos em andamento pelas **[issues marcadas com `wave-1`](https://github.com/olucianochagas/mais-inclusao/labels/wave-1)** e a spec mestra de decomposição em [`docs/superpowers/specs/`](./docs/superpowers/specs/).

---

## Maneiras de contribuir

Contribuição **não é só código**. Reconhecemos publicamente todas as formas:

### 🐛 Reportar um bug

Use o template [Bug Report](./.github/ISSUE_TEMPLATE/bug_report.yml). Inclua passos de reprodução, comportamento esperado e o ambiente onde ocorreu.

### 💡 Propor uma feature

Use o template [Feature Request](./.github/ISSUE_TEMPLATE/feature_request.yml). Descreva o problema do usuário antes da solução. Não toda proposta é aceita — mas toda proposta é lida.

### ♿ Reportar barreira de acessibilidade

Use o template [Accessibility Issue](./.github/ISSUE_TEMPLATE/accessibility_issue.yml). **Estas têm prioridade**: P0 (24h), P1 (1 semana).

### 🔐 Reportar vulnerabilidade de segurança

**NÃO use issues públicas.** Siga o processo de [SECURITY.md](./SECURITY.md).

### 📖 Melhorar documentação

Typo, parágrafo confuso, README de algum pacote ausente, glossário incompleto, exemplo desatualizado — tudo conta. PR direto, sem precisar abrir issue antes.

### 🌐 Traduzir

Atualmente pt-BR é o único idioma. Traduções para inglês ou outras línguas serão extremamente úteis na Onda 2. Abra uma discussion para combinar prioridade.

### 🎨 Design e UX

Mockups, wireframes, jornadas, revisão de fluxos do cidadão — abra issue com label `design`.

### 🧪 Testar (manualmente, com leitor de tela)

Testes manuais com NVDA, VoiceOver, JAWS, lupa, alto contraste, navegação só por teclado, leitor cognitivo — feedback escrito em issue com label `a11y` é altamente valorizado.

### 🗣 Evangelizar e organizar

Escrever post, dar talk, organizar meetup, conectar com órgão público interessado — conta como contribuição. Adicione seu trabalho em `docs/community/` (path a criar) ou abra discussion.

### 💬 Mentorar quem chega

Responder dúvidas em Discussions, fazer pair review em PRs de pessoas novas, escrever guia "como eu fiz X" — vital para a saúde da comunidade.

---

## Antes de começar

### 1. Procure por issue existente

Antes de abrir issue ou começar a codar, **procure** se algo similar já está em discussão. Use:

- [Issues abertas](https://github.com/olucianochagas/mais-inclusao/issues)
- [Discussions](https://github.com/olucianochagas/mais-inclusao/discussions)
- A spec de decomposição em [`docs/superpowers/specs/`](./docs/superpowers/specs/) — a Onda 1 e suas decisões já estão lá.

### 2. Para mudanças grandes, abra issue/discussion primeiro

Mudanças pequenas (fix de typo, melhoria pontual de teste, ajuste de docs) podem ir direto para PR.
Mudanças grandes (nova feature, refactor amplo, mudança de contrato em `packages/contracts`) **precisam de issue ou discussion antes** — para evitar que você invista trabalho num caminho que não será aceito.

### 3. Assine o Código de Conduta implicitamente

Ao contribuir, você concorda em seguir nosso [Código de Conduta](./CODE-OF-CONDUCT.md).

---

## Setup do ambiente de desenvolvimento

### Pré-requisitos

| Ferramenta | Versão mínima | Como instalar |
|---|---|---|
| **Git** | 2.40+ | `apt install git` / `brew install git` |
| **Node.js** | ^24.15.0 | [nvm](https://github.com/nvm-sh/nvm) → `nvm install 24` (ou via `.nvmrc` na raiz) |
| **corepack** | (vem com Node 24) | `corepack enable` (uma vez) — baixa pnpm@11.1.2 automaticamente |
| **Docker** | 26+ | [docs.docker.com](https://docs.docker.com/get-docker/) |
| **Docker Compose** | v2 plugin | Vem com Docker Desktop ou via `apt install docker-compose-plugin` |

> ℹ️ **Não instale `pnpm` manualmente.** O `corepack` baixa a versão exata declarada em `package.json` (`pnpm@11.1.2`) na primeira vez que você rodar `pnpm`. Isso garante que toda a equipe use a mesma versão.

### Setup inicial (uma vez por máquina)

```bash
# 1. Clonar o repositório
git clone git@github.com:olucianochagas/mais-inclusao.git
cd mais-inclusao

# 2. Habilitar corepack (uma vez por máquina, não por projeto)
corepack enable

# 3. Selecionar a versão de Node correta
nvm use   # lê .nvmrc

# 4. Instalar dependências
pnpm install
```

Pronto. A partir daqui, comandos diários:

```bash
pnpm infra:up         # sobe Postgres, Redis, NATS, MailHog, Jaeger, MinIO (Onda 1+)
pnpm dev              # roda todos os serviços em watch mode
pnpm test             # roda testes unitários
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit
```

> ⚠️ **`infra:up` e `dev` só estarão funcionais após o primeiro subprojeto da Onda 1 ser implementado.** Antes disso, os comandos não existem ainda.

### Postura "dev-container purista"

O +Inclusão roda **toda a infra e todos os apps containerizados** em dev — não só Postgres/Redis, mas também os serviços Nest e os frontends Rspack. Isso dá paridade dev/prod absoluta. Você não precisa instalar Node 24 na sua máquina física se preferir — pode rodar tudo via `docker compose exec`. A documentação detalhada de cada caminho virá no scaffold do primeiro subprojeto.

---

## Fluxo de trabalho Git

### 1. Fork (se você não é mantenedor)

Clique em **Fork** no GitHub.

### 2. Crie uma branch a partir de `main`

```bash
git checkout main
git pull origin main
git checkout -b tipo/escopo-descricao-curta
```

**Convenção de nome de branch:**

```
feat/programs-create-eligibility-rule
fix/applications-deadlock-on-triage
docs/contributing-add-dco-section
chore/upgrade-pnpm-to-11.2
refactor/citizens-extract-pii-encryptor
test/applications-statemachine-coverage
a11y/cidadao-mf-form-error-aria
```

### 3. Commit seguindo Conventional Commits + DCO

```bash
git add .
git commit -s -m "feat(programs): add eligibility rule with AND/OR operators

Allows configuring boolean expressions over citizen attributes for
program eligibility evaluation. Stored as JSONB.

Refs: #42"
```

A flag **`-s`** adiciona `Signed-off-by:` no commit — isso é o DCO (ver próxima seção).

### 4. Push e abra PR

```bash
git push origin tipo/escopo-descricao-curta
```

Abra o PR no GitHub apontando para `main`. O [PR template](./.github/PULL_REQUEST_TEMPLATE.md) será carregado automaticamente.

---

## Padrões de commit (Conventional Commits + DCO)

### Conventional Commits

Usamos [Conventional Commits 1.0.0](https://www.conventionalcommits.org/). Estrutura:

```
<tipo>(<escopo opcional>): <descrição curta no imperativo>

<corpo opcional explicando o "porquê", não o "o quê">

<rodapés opcionais: BREAKING CHANGE, Refs, Closes, Co-authored-by, Signed-off-by>
```

**Tipos aceitos:**

| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade visível ao usuário |
| `fix` | Correção de bug |
| `docs` | Apenas documentação |
| `style` | Formatação, sem mudança lógica |
| `refactor` | Refactor sem mudança de comportamento externo |
| `perf` | Melhoria de performance |
| `test` | Adicionar ou ajustar testes |
| `build` | Mudanças no build, deps, scripts |
| `ci` | Mudanças em GitHub Actions, workflows |
| `chore` | Manutenção que não cai em outras |
| `revert` | Reversão de commit anterior |
| `a11y` | Mudanças de acessibilidade (extensão do +Inclusão) |
| `security` | Mudanças relacionadas a segurança (extensão do +Inclusão) |

**Escopos sugeridos** (acompanham apps/packages): `auth`, `programs`, `citizens`, `applications`, `bff-gestor`, `bff-cidadao`, `shell`, `gestor-mf`, `cidadao-mf`, `ui`, `contracts`, `persistence`, `messaging`, `audit`, `infra`, `ci`, `docs`.

**Exemplos:**

```
feat(programs): add JSONB eligibility rule with AND/OR

fix(citizens): handle empty CPF in deterministic hash

docs(contributing): add DCO section

a11y(ui): make Combobox keyboard-navigable (WCAG 2.1.1)

security(auth): rotate refresh token on use to prevent replay

BREAKING CHANGE: ApplicationSubmittedEvent now requires channel field
```

### DCO — Developer Certificate of Origin

Em vez de um CLA (Contributor License Agreement), adotamos o **[Developer Certificate of Origin](https://developercertificate.org/)** v1.1, o mesmo modelo do kernel Linux. É leve e não exige assinar contrato — você apenas adiciona uma linha em cada commit:

```
Signed-off-by: Nome Sobrenome <email@exemplo.com>
```

Faça isso com a flag **`-s`** no `git commit`:

```bash
git commit -s -m "feat(programs): ..."
```

Para configurar uma vez para sempre, garanta que `git config user.name` e `user.email` estão corretos. Você pode até criar um alias:

```bash
git config --global alias.cs "commit -s"
# agora 'git cs -m "..."' já vai sign-off
```

**Significado do DCO:** ao assinar, você declara que **tem o direito** de contribuir o código que está enviando (não é cópia de código alheio com licença incompatível), e que ele será distribuído sob a licença do projeto ([ISC](./LICENSE)).

PRs sem DCO em todos os commits serão bloqueados por verificação automática.

---

## Padrões de código

- **TypeScript estrito** (`strict: true`). Sem `any` exceto em casos justificados em comentário.
- **ESLint** via `@mais-inclusao/eslint-config` (em `packages/eslint-config`). Roda em pre-commit e CI.
- **Prettier** roda em pre-commit via `lint-staged`. Não brigue com o Prettier; configure seu editor para auto-format.
- **Imports:** ordenados pelo ESLint plugin `simple-import-sort`. Imports absolutos via path mapping do `tsconfig`.
- **Nomenclatura:**
  - Arquivos: `kebab-case.ts`. Componentes React: `PascalCase.tsx`.
  - Variáveis e funções: `camelCase`. Tipos e classes: `PascalCase`. Constantes globais: `SCREAMING_SNAKE_CASE`.
- **Logs:** usar `Pino` (no backend) e **nunca logar PII**. Se for tentado, há filtro no logger central, mas a responsabilidade é do desenvolvedor.
- **Comentários:** só quando o *porquê* não é óbvio do código. Não comentar *o quê* já é evidente.
- **Conventional Commits** (já coberto acima) também para mensagens em PR (título do PR vira merge commit).

Configs detalhadas ficam em `packages/eslint-config`, `packages/tsconfig`, `.prettierrc`, `.editorconfig`.

---

## Testes

Esperamos cobertura para:

| Tipo de mudança | Teste exigido |
|---|---|
| Nova função pura, regra de negócio | Vitest unit |
| Endpoint REST | Vitest integration via Testcontainers (PG real) |
| Evento publicado/consumido | Pact ou integration com NATS Testcontainer |
| Componente React | Vitest + RTL |
| Fluxo crítico do cidadão | Playwright E2E + `@axe-core` |
| Acessibilidade de componente em `packages/ui` | `@testing-library/jest-axe` (fixture obrigatório) |

```bash
pnpm test                    # unit (Vitest)
pnpm test:integration        # Testcontainers
pnpm e2e                     # Playwright + axe
pnpm --filter @mais-inclusao/programs test    # filtrar por workspace
```

**Não merge sem teste.** Em casos onde adicionar teste é desproporcional ao risco, justifique no PR e marque revisor adicional.

---

## Documentação

- **README.md de cada app/package** com: o que faz, como rodar, como testar.
- **ADRs** (Architecture Decision Records) em `docs/adr/`. Use o template numerado quando tomar decisão arquitetural relevante. ADRs são **imutáveis** — mudar significa criar uma nova que substitua a anterior.
- **Specs** em `docs/superpowers/specs/` — saem do processo de brainstorming/spec.
- **ROPA** em `docs/legal/ropa.md` — atualizar sempre que tocar PII.
- **CHANGELOG** atualizado via [Changesets](https://github.com/changesets/changesets):

```bash
pnpm changeset       # cria changeset descrevendo mudança (semver bump + descrição)
# commitar o arquivo gerado em .changeset/
```

PR sem changeset que mude API/contrato é bloqueado.

---

## Cuidados especiais: LGPD e PII

O +Inclusão trata dados de populações vulneráveis e dados sensíveis (Art. 11 LGPD). **Toda PR que mexe em PII tem responsabilidade adicional:**

### ✅ Checklist LGPD para PRs que tocam PII

- [ ] **Necessidade.** O dado é realmente necessário para a finalidade? Se posso fazer sem, faça sem.
- [ ] **Finalidade declarada.** A finalidade está no ROPA? Se não, atualize antes ou no mesmo PR.
- [ ] **Base legal.** Qual é? (Art. 7º III políticas públicas, Art. 11 II consentimento qualificado, etc.)
- [ ] **Classificação.** O dado é L0/L1/L2/L3? Tratado conforme regras da classe (criptografia em coluna, audit, retenção)?
- [ ] **Logging.** PII NÃO entrou em log, trace, error message ou breadcrumb?
- [ ] **Repository tenant-aware.** A query passou pelo `TenantAwareRepository`? Não pulei a camada?
- [ ] **Evento.** Se publica evento, payload é "thin"? Sem PII desnecessária? `tenant_id` no header?
- [ ] **Teste.** Há teste E2E que confirma isolamento entre tenants? Há teste que confirma criptografia funcionando?
- [ ] **ROPA atualizado.** Se a finalidade mudou, novo dado entrou, ou retenção mudou — `docs/legal/ropa.md` foi atualizado?
- [ ] **Direito do titular.** Esse dado é exportável (Onda 2)? É anonimizável? É excluível?

Em caso de dúvida, marque o label `lgpd` no PR. Será revisado com lupa.

---

## Cuidados especiais: Acessibilidade

A11y é **definição de pronto**, não nice-to-have. Toda PR de UI passa por:

### ✅ Checklist a11y para PRs de UI

- [ ] **Contraste** validado (AA mínimo 4.5:1 texto, 3:1 não-texto). Use ferramentas como [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/).
- [ ] **Teclado.** Todo controle interativo navegável por Tab/Shift+Tab/Enter/Space. Sem teclado armadilha.
- [ ] **Foco visível.** `:focus-visible` com outline AA contra fundo.
- [ ] **Labels.** Inputs têm label associada explícita (`<label htmlFor>` ou `aria-labelledby`).
- [ ] **Erros.** `aria-describedby` aponta para mensagem de erro. Anúncio via `aria-live="polite"` ou `assertive` conforme contexto.
- [ ] **Headings.** Hierarquia coerente (h1 → h2 → h3). Não pular níveis para efeito visual.
- [ ] **Imagens.** Alt em informativas; `alt=""` em decorativas; ícones interativos com `aria-label`.
- [ ] **Live regions.** Mudanças de estado dinâmicas são anunciadas.
- [ ] **`prefers-reduced-motion`.** Animações respeitam preferência do usuário.
- [ ] **Teste axe.** `pnpm e2e` passou sem violação A/AA. Componente em `packages/ui` tem fixture `jest-axe`.
- [ ] **Teste manual.** Você testou com pelo menos um leitor de tela (NVDA no Win, VoiceOver no Mac, Orca no Linux)? Se não, marque o PR como `needs-a11y-review`.

Label `a11y` no PR sinaliza revisão especializada.

---

## Pull Requests

### Antes de abrir

- [ ] `pnpm lint` passou.
- [ ] `pnpm typecheck` passou.
- [ ] `pnpm test` passou (relevantes).
- [ ] Adicionei/atualizei testes para as mudanças.
- [ ] Adicionei changeset (`pnpm changeset`) se mudei API/contrato.
- [ ] Atualizei docs relevantes (README do package, ADR se mudança arquitetural).
- [ ] Cada commit é `Signed-off-by` (DCO).
- [ ] Título do PR segue Conventional Commits.

### Conteúdo do PR

O [template](./.github/PULL_REQUEST_TEMPLATE.md) carrega automaticamente. Preencha **todas as seções relevantes**.

### Tamanho do PR

Prefira **PRs pequenos**. Como referência:

| Tamanho | Linhas | Tempo de revisão típico |
|---|---|---|
| 🟢 Ideal | < 200 LOC | < 1 hora |
| 🟡 OK | 200-500 LOC | 1-3 horas |
| 🔴 Pesado | 500-1000 LOC | requer split ou pair review |
| ⛔ Recusado | > 1000 LOC | será fechado pedindo split |

Refactors mecânicos em massa (rename, formatação) são exceção e devem estar **isolados** em PR próprio.

---

## Processo de revisão

1. **CI roda.** Lint, typecheck, test, build, codeql. Tudo verde antes de qualquer revisão humana.
2. **Atribuição automática** via [CODEOWNERS](./.github/CODEOWNERS).
3. **Revisão.** Pelo menos **1 aprovação** de mantenedor. Para mudanças em `packages/contracts`, `auth-service`, ou que toquem PII: **2 aprovações** (uma do mantenedor da área + uma adicional).
4. **Feedback.** Mantenedores comentam linha-a-linha. Não tome pessoalmente — feedback é sobre o código, não sobre você.
5. **Iteração.** Você endereça (commit) ou discute (comentário). Re-request review quando estiver pronto.
6. **Merge.** Estratégia padrão: **squash and merge**, com título do PR como mensagem do squash. Exceções: PRs de release ou refactor grande que se beneficiam de manter histórico.
7. **Pós-merge.** Branch é deletada automaticamente. Issue relacionada fecha automaticamente se PR teve `Closes #N`.

**SLA de primeira resposta dos mantenedores:** best-effort, esperar até 7 dias. Após isso, ping educado é bem-vindo.

---

## Quem revisa o quê

Atribuição automática via [`.github/CODEOWNERS`](./.github/CODEOWNERS). Resumo conceitual:

| Área | Revisor primário (atual) |
|---|---|
| Tudo | @olucianochagas (BDFL transitório — ver [GOVERNANCE.md](./GOVERNANCE.md)) |
| `packages/contracts` | @olucianochagas + chamado especial para revisão de quem consome |
| Docs (README, CONTRIBUTING, etc) | @olucianochagas |
| `docs/legal/*` (ROPA, DPA) | @olucianochagas (no futuro, DPO designado) |
| `docs/security/*` | @olucianochagas |
| `packages/ui` (a11y) | @olucianochagas (no futuro, especialista a11y) |

Conforme novos mantenedores se juntarem, CODEOWNERS evolui.

---

## Reconhecimento

Toda contribuição é reconhecida — código, docs, design, a11y, evangelismo. Manteremos uma lista pública de contribuidores em `CONTRIBUTORS.md` (a criar), incluindo nome social (não civil necessariamente), pronomes (se a pessoa quiser), e a área principal de contribuição.

Contribuições não-codificadas (mentoria, organização, tradução, testes manuais) entram no mesmo nível. Use o trailer **`Co-authored-by:`** em commits quando alguém contribuiu de outra forma — por exemplo, deu a ideia, fez o design, testou com leitor de tela.

---

## Em caso de dúvida

- 📖 Releia o [README.md](./README.md) e a [spec de decomposição](./docs/superpowers/specs/).
- 💬 Abra uma [Discussion](https://github.com/olucianochagas/mais-inclusao/discussions) (preferido para dúvidas).
- 🐛 Se for bug evidente, abra uma issue diretamente.
- 📧 Para temas sensíveis ou de governança: olucianochagas@gmail.com.

**Sem perguntas tolas.** Se você precisou perguntar, provavelmente outra pessoa também precisará — e a resposta documentada ajuda quem chega depois.

---

**Obrigado por estar aqui. Vamos construir algo que vale a pena.**

— Equipe +Inclusão
