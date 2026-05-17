<!--
Obrigado por contribuir com o +Inclusão!

Antes de abrir o PR, releia:
- CONTRIBUTING.md  — fluxo de trabalho, padrões, checklists detalhados
- CODE-OF-CONDUCT.md — conduta esperada na comunidade
- SECURITY.md      — se a mudança toca segurança
- GOVERNANCE.md    — para decisões grandes (RFC)

Preencha as seções relevantes abaixo. Apague seções que não se aplicam.
-->

## Resumo

<!-- 1-3 frases. O QUE este PR muda. -->

## Motivação

<!-- O PORQUÊ. Que problema resolve? Que dor de usuário? Que dívida técnica reduz? Link para issue/discussion. -->

Closes #

## Tipo de mudança

<!-- Marque com [x] o que se aplica. -->

- [ ] 🐛 Bug fix (mudança que corrige um problema, sem quebrar API)
- [ ] ✨ Nova feature (mudança que adiciona funcionalidade, sem quebrar API)
- [ ] 💥 Breaking change (fix ou feature que muda comportamento ou API públicos)
- [ ] 📖 Documentação (apenas docs, sem mudança de código)
- [ ] ♿ Acessibilidade (WCAG, leitor de tela, teclado, contraste)
- [ ] 🔐 Segurança (correção, hardening)
- [ ] 🔒 LGPD / privacidade (tratamento de PII, ROPA, consentimento)
- [ ] 🎨 Refactor (sem mudança de comportamento externo)
- [ ] 🧪 Teste (adicionando ou corrigindo testes)
- [ ] 🛠 Build / CI / DevOps
- [ ] 🧹 Chore (manutenção, deps, configuração)

## Como testar

<!--
Passos para reviewer reproduzir / validar.
Inclua: como subir, qual comando rodar, o que observar.
Se PR de UI: descreva o caminho de teclado e o que axe espera.
-->

```bash
# exemplo
pnpm install
pnpm dev
# acesse http://localhost:5173/...
```

## Screenshots / vídeos (se UI)

<!-- Antes/depois, ou gravação do fluxo. Para a11y, anexe também output do axe ou gravação com leitor de tela. -->

## Áreas tocadas

<!-- Marque para ajudar o reviewer. -->

- [ ] Backend — serviço(s): `auth-service` / `programs-service` / `citizens-service` / `applications-service` / `bff-gestor` / `bff-cidadao`
- [ ] Frontend — app(s): `shell` / `gestor-mf` / `cidadao-mf`
- [ ] `packages/contracts` — DTOs ou eventos públicos
- [ ] `packages/ui` — componentes ou tokens
- [ ] `packages/persistence` / `packages/messaging` / `packages/audit` / `packages/observability`
- [ ] `tools/` — CLI ou codegen
- [ ] `infra/` — Docker, Compose, K8s, IaC
- [ ] `docs/` — README, ADR, specs, legal
- [ ] `.github/` — workflows, templates, configs

## Checklist do autor

<!-- Marque [x] o que confere. PRs incompletos podem ser fechados pedindo revisão. -->

### Sempre

- [ ] Cada commit é `Signed-off-by:` (DCO via `git commit -s`)
- [ ] Título do PR segue [Conventional Commits](https://www.conventionalcommits.org/)
- [ ] `pnpm lint` passou
- [ ] `pnpm typecheck` passou
- [ ] `pnpm test` passou (afetados pelo branch)
- [ ] Adicionei/atualizei testes para as mudanças significativas
- [ ] Atualizei documentação relevante (README do package, ADR se decisão arquitetural)
- [ ] Não há `console.log`, `debugger`, ou TODO esquecido

### Se PR muda contrato (`packages/contracts`) ou API/eventos públicos

- [ ] Rodei `pnpm changeset` e commitei o arquivo gerado em `.changeset/`
- [ ] Avaliei se é breaking change e classifiquei (`major` / `minor` / `patch`)
- [ ] Se breaking: documentei o **path de migração** (arquivo em `docs/migration/` ou seção no CHANGELOG)
- [ ] Atualizei consumers do contrato (BFFs, frontends) se a mudança quebra

<details>
<summary>♿ <b>Se PR mexe em UI / Frontend (clique para expandir)</b></summary>

- [ ] Contraste de cores validado (AA: ≥ 4.5:1 texto, ≥ 3:1 não-texto)
- [ ] Todos os controles interativos navegáveis por teclado (Tab/Shift+Tab/Enter/Space)
- [ ] Foco visível com `:focus-visible` (outline 2px, contraste AA)
- [ ] Inputs têm label associado (`<label htmlFor>` ou `aria-labelledby`)
- [ ] Mensagens de erro têm `aria-describedby` e são anunciadas (`aria-live`)
- [ ] Headings hierárquicos (h1 → h2 → h3, sem pular níveis)
- [ ] Imagens informativas têm `alt` descritivo; decorativas têm `alt=""`
- [ ] Respeita `prefers-reduced-motion`
- [ ] `pnpm e2e` passou (Playwright + axe-core)
- [ ] **Testei com pelo menos um leitor de tela** (NVDA, VoiceOver, Orca) — ou marquei o PR com `needs-a11y-review`

</details>

<details>
<summary>🔒 <b>Se PR toca PII ou regras de privacidade (clique para expandir)</b></summary>

- [ ] **Necessidade.** O dado é necessário para a finalidade declarada
- [ ] **Finalidade declarada** consta no ROPA (`docs/legal/ropa.md`); se não, atualizei
- [ ] **Base legal** identificada (Art. 7º ou Art. 11 LGPD)
- [ ] **Classificação** correta (L0/L1/L2/L3) e tratamento conforme classe (criptografia, audit, retenção)
- [ ] **PII não vaza para log, trace, error, breadcrumb** (verifiquei filtros do Pino)
- [ ] Query passou pelo `TenantAwareRepository` (não pulei a camada)
- [ ] Se publica evento: payload "thin" sem PII desnecessária; `tenant_id` no header
- [ ] Há teste de **isolamento entre tenants** que confirma o filtro
- [ ] Há teste que confirma **criptografia em coluna** funcionando (se aplicável)
- [ ] Atualizei `docs/legal/ropa.md` (CI rule path-touch)
- [ ] Considerei direitos do titular (export, anonimização, exclusão)
- [ ] Marquei label `lgpd` no PR para revisão dedicada

</details>

<details>
<summary>🔐 <b>Se PR muda código de segurança (auth, crypto, secrets)</b></summary>

- [ ] Não há secret hardcoded
- [ ] Configs sensíveis vêm de env / Vault / KMS, não do código
- [ ] Mudanças em auth/crypto têm teste E2E que confirma o fluxo
- [ ] Marquei label `security` para revisão dedicada
- [ ] Se descoberta vulnerabilidade: segui `SECURITY.md` (não reporte aqui pública)

</details>

## Riscos e mitigações

<!-- Qual é o pior cenário se este PR causar problema? Que mitigação você tem? Rollback possível? -->

## Notas para o revisor

<!-- Algo que o reviewer precisa saber, contexto extra, decisões controversas, partes que merecem atenção. -->

---

> Ao submeter, concordo em respeitar o [Código de Conduta](../CODE-OF-CONDUCT.md) e em contribuir sob a licença do projeto ([ISC](../LICENSE)).
