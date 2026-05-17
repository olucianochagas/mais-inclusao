# +Inclusão (mais-inclusao) — Decomposição do programa em subprojetos

| | |
|---|---|
| **Data** | 2026-05-16 |
| **Autor** | Luciano Douglas Machado Chagas <olucianochagas@gmail.com> |
| **Tipo de spec** | Decomposição de programa (não-feature). Mapa pleno de bounded contexts + arquitetura da Onda 1 + roadmap evolutivo. |
| **Status** | Aprovado pelo usuário em todas as 6 seções. Aguarda revisão final do doc consolidado. |
| **Próximo artefato** | Plano de implementação da Onda 1 (`writing-plans`) para o primeiro subprojeto escolhido. |
| **Repositório** | `git+ssh://git@github.com/olucianochagas/mais-inclusao.git` |

---

## Sumário

1. [Sumário executivo](#sumário-executivo)
2. [Contexto e premissas](#contexto-e-premissas)
3. [Decisão de abordagem](#decisão-de-abordagem)
4. [Seção 1 — Mapa pleno de bounded contexts](#seção-1--mapa-pleno-de-bounded-contexts)
5. [Seção 2A — Onda 1 backend](#seção-2a--onda-1-backend)
6. [Seção 2B — Onda 1 frontend](#seção-2b--onda-1-frontend)
7. [Seção 3 — Estrutura do monorepo Turborepo](#seção-3--estrutura-do-monorepo-turborepo)
8. [Seção 4 — Contratos, eventos, sagas e Outbox](#seção-4--contratos-eventos-sagas-e-outbox)
9. [Seção 5 — LGPD, multi-tenancy, segurança e acessibilidade](#seção-5--lgpd-multi-tenancy-segurança-e-acessibilidade)
10. [Seção 6 — Ondas seguintes e gatilhos de extração](#seção-6--ondas-seguintes-e-gatilhos-de-extração)
11. [Próximos passos](#próximos-passos)
12. [Apêndices](#apêndices)

---

## Sumário executivo

O **+Inclusão (mais-inclusao)** é um SaaS multi-tenant para governança pública de inclusão social. Atende secretarias, ONGs e consórcios públicos; o operador SaaS atua como **operador LGPD**, os tenants como **controladores** e os cidadãos como **titulares**. O núcleo do produto é o **catálogo e operacionalização de programas/benefícios sociais** com **inscrição omnichannel** (cidadão via portal, gestor via backoffice, integrações externas via ETL).

A arquitetura adotada é de **microsserviços evolutivos por bounded context** (DDD), construída em **3 ondas** sobre um monorepo Turborepo gerenciado por pnpm 11.1.2. A Onda 1 entrega um MVP de ponta a ponta com 4 microsserviços de domínio NestJS, 2 BFFs, 2 micro frontends Module Federation (gestor e cidadão light) e 1 design system compartilhado. Ondas 2 e 3 extraem novos serviços apenas quando gatilhos concretos justificam.

Esta spec materializa as decisões de **22 bounded contexts** identificados (5 core + 6 supporting + 7 generic/platform + 4 frontend), distribuídos em 3 ondas. Além dos contextos, o programa comporta **4 unidades transversais** que não são bounded contexts isolados — 1 capability transversal (Audit), 1 package de design system (`packages/ui`), e 2 evoluções/extrações (Cidadão MF light → full e Eligibility embutido → dedicado). A fundação técnica completa cobre mensageria via NATS JetStream + Outbox, multi-tenancy em 6 camadas, criptografia de PII por tenant, e postura WCAG 2.2 AA. Esta spec não é design de feature; é o documento-mãe a partir do qual cada subprojeto recebe seu próprio ciclo de `brainstorming → spec → plano → implementação`.

---

## Contexto e premissas

### Natureza institucional

**SaaS multi-tenant para gestores.** Cada cliente (município, secretaria, ONG, consórcio) é um tenant isolado. Demanda billing, onboarding, isolamento rígido e contrato/DPA por cliente. Operador SaaS é responsável por medidas de segurança e disponibilidade; controlador (tenant) define finalidades de tratamento e recebe pedidos do titular.

### Job-to-be-done principal

**Catálogo e operacionalização de programas/benefícios sociais.** Gestor configura programas (cesta básica, auxílio, cursos, vagas em abrigo, etc.), define critérios de elegibilidade, recebe candidaturas, faz triagem, concede e acompanha entrega. O coração do sistema é o **programa/benefício e seu funil de inscrição → triagem → concessão → entrega**.

Funções secundárias (gestão de casos, governança por indicadores, comunicação multicanal) entram em ondas posteriores.

### Origem das inscrições — omnichannel

Inscrições podem ser originadas por três canais distintos no mesmo programa:

1. **Cidadão** via portal/app (autoatendimento)
2. **Servidor/Gestor** via backoffice (atendimento presencial)
3. **Integração externa** (CadÚnico, planilhas, APIs parceiras)

Cada candidatura registra **proveniência do canal de origem**. A omnicanalidade adiciona:
- Portal cidadão (segunda app Module Federation com requisitos pesados de a11y e autenticação cidadã)
- ETL/ingestão de integrações
- Resolução de identidade (mesmo cidadão entrando por 3 canais não pode virar 3 cadastros)
- Auditoria de origem
- Fila unificada de triagem com proveniência

### Realidade de equipe/prazo

**Não há prazo definido nem tamanho de equipe firmado.** Esta spec entrega o **mapa pleno** com dependências e ordem sugerida; o usuário fatia conforme realidade for surgindo. A Onda 1 é o MVP minimamente viável; ondas seguintes são acionadas por gatilhos (Seção 6).

### Grupos atendidos

População em vulnerabilidade social, pessoas com deficiência, idosos, crianças e adolescentes, mulheres, população LGBTQIA+ e demais grupos marginalizados. Implicações:

- **Dados sensíveis** (raça, gênero, orientação sexual, deficiência) caem no Art. 11 da LGPD com base legal qualificada.
- **Acessibilidade** é core do produto, não feature — WCAG 2.2 AA desde o dia 1.
- **Linguagem cidadã** revisada por especialista (Onda 2).

---

## Decisão de abordagem

Três abordagens foram avaliadas:

| | A — Big-bang microservices | B — Microsserviços evolutivos por bounded context (Recomendada) | C — Capability-based |
|---|---|---|---|
| Granularidade | 15–20 serviços do dia 0 | 4 serviços + 2 BFFs na Onda 1, expansão por evidência | 1 monolito de domínio + serviços técnicos |
| Velocidade do MVP | Baixa | Média-alta | Alta |
| Complexidade operacional | Brutal | Sustentável | Baixa-média |
| Risco | Fronteiras adivinhadas erram, refactor distribuído caro | Disciplina exigida para contratos públicos | Monolito de domínio cresce; atrito com requisito original |

**Escolha: Abordagem B — Microsserviços evolutivos por bounded context.**

**Por quê:** Honra a aposta arquitetural do usuário (microsserviços NestJS + micro frontends Module Federation) com cadência sustentável. A Onda 1 entrega valor de ponta a ponta (cadastrar programa → receber inscrição → triar → conceder) com fronteiras pragmáticas; as ondas seguintes extraem novos serviços quando os **gatilhos** se materializam (escala, time, regulação, domínio, release cadence, teste — ver Seção 6).

A disciplina não-negociável é: **contratos públicos entre serviços desde o dia 0**, mesmo dentro de um único deploy se necessário. Isto torna a extração futura uma operação técnica, não uma refatoração de design.

---

## Seção 1 — Mapa pleno de bounded contexts

**22 bounded contexts** organizados em 4 swimlanes (Core / Supporting / Generic / Frontend) e 3 ondas (1 / 2 / 3+). Acrescentam-se **4 unidades transversais** ao final desta seção (capability Audit, package `ui`, e duas evoluções) que totalizam 26 unidades de design.

### Core domain (5 contextos)

| Contexto | Onda | Papel |
|---|---|---|
| **Programs Catalog** | 1 | Configuração de programas/benefícios, critérios de elegibilidade, ciclo de vida. **Eligibility embutido** na Onda 1 e extraído como serviço dedicado na Onda 3 (mesmo contexto, refinado). |
| **Application Lifecycle** | 1 | Inscrição omnichannel → triagem → concessão. Estado-máquina único. Proveniência do canal gravada. |
| **Citizens** | 1 | Cadastro de cidadão (versão **light** na Onda 1; completa a partir da Onda 2 com direitos LGPD operacionalizados). |
| **Identity Resolution** | 2 | Matching/merging cross-canal (determinístico + probabilístico). Trilha reversível. |
| **Delivery** | 2 | Operação pós-concessão: agendamento, retirada, comprovação fotográfica, no-show. |

### Supporting subdomains (6 contextos)

| Contexto | Onda | Papel |
|---|---|---|
| **Documents** | 2 | Anexos com criptografia em repouso e AV scan. |
| **Case Notes** | 2 | Diário operacional de atendimentos (não é prontuário completo). |
| **Referrals** | 3 | Encaminhamentos entre programas e entre tenants conveniados. |
| **Territory** | 3 | Geolocalização, setores censitários, busca ativa, mapeamento de cobertura. |
| **Analytics / Indicators** | 3 | Governança por evidências: cobertura, desigualdades por raça/gênero/idade. |
| **ETL / Integrations** | 3 | Ingestão CadÚnico, planilhas, APIs de parceiros. Idempotência + reconciliação. |

### Generic / platform (7 contextos)

| Contexto | Onda | Papel |
|---|---|---|
| **Identity (gestor) + Tenancy** | 1 | Tenants, usuários gestores, papéis, OIDC interno, RBAC. **Fundidos** na Onda 1. |
| **Citizen Identity** | 2 | Autenticação do cidadão (e-mail+CPF na Onda 1; Gov.br plugável na Onda 2). |
| **Notifications** | 2 | Email/SMS/WhatsApp/push. Templates por tenant, fila persistente, fallback entre canais. |
| **Consent & LGPD** | 2 | Aceites granulares, ROPA digital, direitos do titular operacionalizados. |
| **Search** | 3 | Indexação cross-context (Meilisearch ou OpenSearch). |
| **Billing** | 3 | Planos, faturas, gateway. Só quando houver tenant pagante. |
| **Feature Flags / Config** | 3 | Toggles por tenant, segmentação. |

### Frontend apps (4 contextos)

| Contexto | Onda | Papel |
|---|---|---|
| **Shell Host** | 1 | Casca MF: layout, auth context, theme, i18n, router, telemetria. |
| **Gestor MF (remote)** | 1 | Painel gestor: programas, inscrições, triagem, concessão, atendimentos. |
| **Cidadão MF (remote)** | 1 | Portal do cidadão. Versão **light** na Onda 1 (descobrir programas, criar conta, inscrever-se, WCAG 2.2 AA); evolui para **full** na Onda 2 (Gov.br, direitos LGPD, PWA). |
| **Admin Plataforma MF** | 3 | Super-admin do operador SaaS. Substitui CLI `tools/cli`. |

### Unidades transversais (4 — não-bounded-contexts)

| Unidade | Onda | Tipo | Papel |
|---|---|---|---|
| **Audit** | 1 (capability) · 3 (serviço dedicado) | Capability transversal | Nest Interceptor + `packages/audit` consumido por todos serviços na Onda 1; vira serviço próprio na Onda 3 com storage especializado e export legal. |
| **`packages/ui` — Design System** | 1 | Package compartilhado | Radix + Tailwind copiado shadcn-style. Consumido por todos os frontends. |
| **Eligibility (dedicado)** | 3 | Extração do Programs Catalog | Mesmo contexto refinado: motor de regras complexas (cruzamento, simulação) extraído quando atinge >5 ramos condicionais. |
| **Outras packages cross-cutting** | 1 | Packages compartilhados | `packages/contracts`, `packages/persistence`, `packages/messaging`, `packages/observability`, `packages/auth-react`, `packages/testing`, configs ESLint/tsconfig/tailwind. |

### Dependências determinantes entre contextos

- `Application Lifecycle` ← consome `Programs Catalog` (regras de elegibilidade) e `Citizens` (sujeito da inscrição).
- **Todos os serviços** ← consomem `Identity + Tenancy` (token JWT com `tenant_id` claim; isolamento por tenant é invariante de toda query).
- `Notifications` ← reage a eventos de domínio: `application.submitted`, `application.granted`, `delivery.scheduled`.
- `Citizen Identity` resolve o **sujeito** que se autentica; `Identity Resolution` resolve o **cidadão único** por trás de múltiplos cadastros — são contextos distintos, frequentemente confundidos.
- **BFFs** (gestor e cidadão) agregam chamadas. Frontends nunca falam direto com serviços de domínio.
- `Audit` é interceptor transversal na Onda 1 e vira serviço dedicado na Onda 3 quando o volume e a retenção exigirem.
- `Consent & LGPD` é dependência hard de `Citizen Identity`: aceite da finalidade vem antes do cadastro de PII.

---

## Seção 2A — Onda 1 backend

### Stack opinionado da Onda 1

| Camada | Decisão |
|---|---|
| Runtime | Node.js `^24.15.0` |
| Linguagem | TypeScript 5.6+ (strict) |
| Framework | NestJS 11 + `@nestjs/microservices` |
| ORM | Prisma 6 (migrações declarativas) |
| Banco | PostgreSQL 16 — 1 schema por serviço, mesmo cluster |
| Mensageria | NATS JetStream (leve, durável, ack) |
| Outbox | Tabela `outbox_event` + worker por serviço |
| Cache / Sessão | Redis 7 |
| Validação | Zod + DTOs em `packages/contracts` |
| Auth | OIDC interno; JWT com claim `tenant_id`; `argon2id` para senhas |
| Multi-tenancy | Discriminator `tenant_id` em toda tabela; RLS Postgres como Onda 2 |
| Logs | Pino JSON (com `tenant_id`, `trace_id`, `user_id` em todo log) |
| Tracing | OpenTelemetry → Tempo ou Jaeger |
| Testes | Vitest unit + Testcontainers integração + Pact contratos |

### 7 unidades da Onda 1 backend

#### 1. `auth-service` — Identity + Tenancy
- **Porta:** 3010 · **Schema PG:** `auth`
- **Responsabilidades:** tenants, usuários gestores, papéis/RBAC, OIDC interno (login/refresh), emissão de JWT com claim `tenant_id`.
- **Agregados:** `Tenant`, `User`, `Role`, `Permission`.
- **Endpoints chave:** `POST /auth/login`, `POST /auth/refresh`, `GET /me`, `GET/POST /tenants`, `GET/POST /users`.
- **Eventos publicados:** `auth.tenant.created`, `auth.tenant.deactivated`, `auth.user.created`, `auth.user.deactivated`.
- **Persistência:** senhas em `argon2id`; outbox `auth.outbox_event`.
- **Limites Onda 1:** sem MFA (Onda 2), sem SSO empresarial (Onda 3), sem self-service de tenant (operador provisiona via CLI), sem identidade do cidadão (vem em Onda 2 via `citizen-identity-service`).

#### 2. `programs-service` — Programs Catalog + Eligibility (embutido)
- **Porta:** 3020 · **Schema PG:** `programs`
- **Responsabilidades:** CRUD de programas por tenant, critérios de elegibilidade em DSL JSON simples, ciclo de vida `DRAFT → PUBLISHED → CLOSED`, avaliação de elegibilidade (consulta sync).
- **Agregados:** `Program` (raiz), `EligibilityRule` (filha).
- **Endpoints chave:** `GET/POST /programs`, `PUT /programs/:id/rules`, `POST /programs/:id/publish`, `POST /programs/:id/evaluate`.
- **Eventos publicados:** `programs.program.published`, `programs.program.closed`, `programs.program.rules_updated`.
- **Eventos consumidos:** `auth.tenant.deactivated` → encerra programs órfãos.
- **Persistência:** regras em `jsonb` (operadores `AND/OR/<,>,=,IN`).
- **Limites Onda 1:** sem motor estilo Drools, sem simulação, sem versionamento histórico de regras.

#### 3. `citizens-service` — Citizens (light)
- **Porta:** 3030 · **Schema PG:** `citizens`
- **Responsabilidades:** cadastro de cidadão, família simples (parent_id linear), vulnerabilidades autodeclaradas.
- **Agregados:** `Citizen` (raiz), `Household` (raiz), `Vulnerability` (valor).
- **Endpoints chave:** `GET/POST /citizens`, `GET/PATCH /citizens/:id`, `GET /citizens/search?cpf=...`.
- **Eventos publicados:** `citizens.citizen.created`, `citizens.citizen.updated`, `citizens.vulnerability.declared`.
- **Persistência:** **PII criptografada em coluna** (CPF, telefone, e-mail, endereço) com chave por tenant via KMS/Vault; CPF normalizado + hash determinístico HMAC-SHA256 para busca.
- **Limites Onda 1:** sem deduplicação omnichannel (Onda 2 via `identity-resolution-service`), sem busca avançada (Onda 3), sem direitos LGPD operacionalizados (Onda 2).

#### 4. `applications-service` — Application Lifecycle
- **Porta:** 3040 · **Schema PG:** `applications`
- **Responsabilidades:** Inscrição (omnichannel: cidadão, gestor, ETL stub) + Triagem (humana + regras) + Concessão (workflow). Estado-máquina único por candidatura. Proveniência do canal de origem.
- **Agregados:** `Application` (raiz, com `state`, `channel`, `provenance`), `TriageDecision`, `Grant`.
- **Estado-máquina:** `DRAFT → SUBMITTED → IN_TRIAGE → APPROVED|REJECTED|CANCELED → GRANTED|DENIED`.
- **Endpoints chave:** `POST /applications`, `POST /applications/:id/triage`, `POST /applications/:id/decision`, `GET /applications?status=...&program=...`.
- **Eventos publicados:** `applications.application.submitted`, `applications.triage.completed`, `applications.application.granted`, `applications.application.rejected`.
- **Eventos consumidos:** `programs.program.closed` → encerra applications em DRAFT; `citizens.citizen.deleted` → anonimiza histórico (Onda 2).
- **Persistência:** FK lógicas (não físicas) para `program_id` e `citizen_id` (cross-service). Consistência por eventos + reconciliação periódica.
- **Limites Onda 1:** sem entrega pós-concessão (Onda 2 via `delivery-service`); sem encaminhamento entre programas (Onda 3 via `referrals-service`); triagem só linear (uma fase).

#### 5. `bff-gestor` — Backend for Frontend (gestor)
- **Porta:** 3000 · **Stateless**
- **Responsabilidades:** agrega chamadas para o Gestor MF; valida JWT contra `auth-service` (cache de JWKS); sessão de UI em Redis (cookie `HttpOnly Secure SameSite=Lax`); CSRF, CORS estrito, rate limiting moderado.
- **Não faz:** regra de negócio, persistência de domínio, GraphQL (REST + caching de leituras).

#### 6. `bff-cidadao` — Backend for Frontend (cidadão)
- **Porta:** 3001 · **Stateless**
- **Responsabilidades:** endpoint público para listar programas e abrir inscrição; sessão cidadã (e-mail+CPF+senha na Onda 1; Gov.br Onda 2); rate limit agressivo por IP+CPF; CSP rígido, CSRF, captcha em endpoints sensíveis.

#### 7. `@mais-inclusao/audit` — capability transversal (não-serviço)
- **Package:** `packages/audit`
- **Implementação:** pacote npm interno consumido por todos serviços; exporta `AuditInterceptor` Nest + decorator `@Audited`.
- **O que é auditado:** acessos a endpoints que tocam PII; mudanças de estado em Application e Grant; criação/desativação de User e Tenant.
- **Onde grava:** tabela `audit_log` do próprio banco do serviço.
- **Por que não-serviço na Onda 1:** volume baixo, centralizar adiciona ponto de falha. Vira serviço dedicado na Onda 3 quando exigir export legal e retenção heterogênea por tenant.

### Invariantes transversais (Onda 1)

1. **Multi-tenancy.** `tenant_id` em toda tabela; claim do JWT é invariante de toda query. Repository base falha se a query sair sem o filtro. Postgres RLS entra na Onda 2 como defesa em profundidade.
2. **Eventos via Outbox Pattern.** A transação grava entidade + linha em `outbox_event`; worker do serviço despacha para NATS com retry/dedup. Consistência sem 2PC.
3. **Contratos públicos versionados.** Schemas de eventos e DTOs de API ficam em `packages/contracts`, versionados (SemVer). Quebra de contrato é PR explícito; consumidores rodam Pact no CI.

---

## Seção 2B — Onda 1 frontend

### Stack opinionado de frontend

| Camada | Decisão |
|---|---|
| UI Framework | React 19 (SPA-mode; sem RSC nesta onda) |
| Bundler | Rspack + Module Federation 2.0 |
| Router | React Router v7 (data router) |
| Server state | TanStack Query v5 |
| UI state | Zustand (mínimo, sem Redux) |
| Estilo | Tailwind CSS 4 + design tokens via CSS vars |
| Componentes | shadcn/ui (Radix) **copiado** em `packages/ui` |
| Forms | React Hook Form + Zod (schemas de `packages/contracts`) |
| i18n | react-i18next — pt-BR único na Onda 1 |
| A11y | WCAG 2.2 AA + `@axe-core/playwright` no CI |
| Testes | Vitest+RTL (unit) + Playwright (E2E) |
| Observabilidade | OpenTelemetry web SDK + Core Web Vitals → backend |

### 5 unidades da Onda 1 frontend

#### 1. `apps/shell` — Host (Module Federation)
- **Responsabilidades:** carregar remotes em runtime via federation manifest; layout global (header/footer/nav); providers (Auth, Theme, i18n, QueryClient, ErrorBoundary global); roteamento de top-level (`/gestor/*`, `/cidadao/*`, `/` público); bootstrap de telemetria (OpenTelemetry web + Web Vitals); registro de Service Worker (apenas portal cidadão).
- **Singletons compartilhados (MF shared, strictVersion):** `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `@mais-inclusao/ui`, `@mais-inclusao/auth-react`.
- **Não faz:** regra de domínio, chamadas diretas a serviços, montar ambos remotes simultaneamente.

#### 2. `apps/gestor-mf` — Remote: Painel Gestor
- **Exposição:** `./GestorApp` · **Basename:** `/gestor`
- **Rotas:** `/programs`, `/applications`, `/applications/:id`, `/citizens`, `/reports`.
- **Conexões:** lê `useAuth()` do `@mais-inclusao/auth-react`; componentes do `@mais-inclusao/ui`; chamadas via fetch interceptado (injeta JWT) → `bff-gestor`.
- **Estado:** server state via TanStack Query; UI state local em hooks; Zustand só para slice global (toasts, sidebar).
- **Limites Onda 1:** relatórios = listagem + CSV (sem BI); sem agendamento de entrega (Onda 2); triagem com 1 avaliador.

#### 3. `apps/cidadao-mf` — Remote: Portal Cidadão (light)
- **Exposição:** `./CidadaoApp` · **Basename:** `/cidadao` · **Mobile-first** · **PWA**
- **Rotas:** `/`, `/programas`, `/programas/:slug`, `/criar-conta`, `/entrar`, `/minhas-inscricoes`, `/inscricao/:programa`.
- **Postura:** mobile-first (testado em viewport 320px); WCAG 2.2 AA obrigatório; PWA mínimo (manifest + SW para shell-caching, não offline-first); SEO via SSG do shell para landing pages; sitemap dinâmico via BFF.
- **Conexões:** sessão cidadã própria (cookie distinto da do gestor); chamadas via `bff-cidadao`; captcha em `/criar-conta` e `/inscricao`.
- **Limites Onda 1:** sem Gov.br (Onda 2); sem direitos LGPD operacionalizados (Onda 2); sem notificações in-app (Onda 2); sem offline-first.

#### 4. `packages/ui` — Design System
- **Filosofia:** shadcn-style — componentes **copiados** e versionados no monorepo, não importados de pacote externo. Zero peso de runtime extra. Multi-tenant theming via `data-theme` + CSS vars.
- **Entrega:** tokens (cores, espaçamentos, tipografia) via CSS variables; componentes acessíveis (Button, Input, Combobox, Dialog, Tabs, Toast, DataGrid, Pagination, Form RHF wrappers); layout primitives (Stack, Grid, Cluster); ícones (Lucide React singleton).
- **A11y embutida:** focus ring, ARIA correto, suporte completo a teclado.
- **Storybook:** Onda 2. Na Onda 1, docs em README + rota oculta no shell para playground.

#### 5. `packages/auth-react` — SDK frontend de auth
- **Exporta:** `<AuthProvider />` (hospedado no shell); `useAuth()` retornando `{ user, tenant, roles, signIn, signOut, isAuthenticated }`; `createAuthFetch()` (fetch wrapper que injeta JWT + silent refresh em 401); `<RequireRole />` guard declarativo.
- **Comportamento:** tokens em `HttpOnly Secure SameSite=Lax` (definidos pelos BFFs); refresh automático antes da expiração; logout cross-tab via BroadcastChannel.

### Acessibilidade WCAG 2.2 AA — postura Onda 1

| Prática | Implementação |
|---|---|
| Contraste | Mínimo 4.5:1 (texto) / 3:1 (não-texto). Tokens validados em build via script no CI. |
| Teclado | 100% dos fluxos críticos do cidadão navegáveis sem mouse. Skip-to-content em todas as páginas. |
| Foco visível | `:focus-visible` com outline 2px, contraste AA contra fundo. Nunca remover. |
| Forms | Labels associadas, erros descritivos com `aria-describedby`, agrupamento por `fieldset`, instruções antes do campo. |
| Live regions | Mudanças de estado anunciadas via `aria-live="polite"`. |
| Imagens | Alt obrigatório em semânticas; `alt=""` em decorativas; ícones com `aria-label` quando interativos. |
| Movimento | Respeito a `prefers-reduced-motion`; sem auto-play > 5s. |
| Teste automático | `@axe-core/playwright` em E2E críticos do cidadão; falha o build em violação A/AA. |
| Teste manual | Cada release passa por checklist com NVDA/VoiceOver em 1 fluxo crítico do cidadão. |

### Decisões transversais do frontend

1. **Federation 2.0 + Rspack.** Plugin oficial gera typings dos remotes; shell carrega manifest publicado no CDN com nome estável por release imutável. Permite rollback instantâneo apontando manifest anterior.
2. **Sem RSC nem SSR full.** RSC + MF é território instável. CSR + SSG do shell para landing pages do portal cidadão (SEO básico). Server Components fica como opção futura para Onda 3+.
3. **Sessões separadas.** Cookie de gestor e cidadão são distintos (paths/domínios). Um nunca eleva ao outro.
4. **Telemetria web → backend.** Web Vitals (LCP, CLS, INP) e erros JS enviados via beacon para endpoint do BFF que repassa ao backbone OTel. Erros do cidadão são anonimizados.

---

## Seção 3 — Estrutura do monorepo Turborepo

### Árvore de pastas

```
mais-inclusao/
├── apps/
│   ├── shell/                       # MF host (React 19 + Rspack)
│   ├── gestor-mf/                   # MF remote — Painel Gestor
│   ├── cidadao-mf/                  # MF remote — Portal Cidadão (light)
│   ├── bff-gestor/                  # NestJS REST · porta 3000
│   ├── bff-cidadao/                 # NestJS REST · porta 3001
│   ├── auth-service/                # NestJS · Identity + Tenancy · 3010
│   ├── programs-service/            # NestJS · Programs + Eligibility · 3020
│   ├── citizens-service/            # NestJS · Citizens (light) · 3030
│   └── applications-service/        # NestJS · Application Lifecycle · 3040
│
├── packages/
│   ├── ui/                          # Design System (Radix + Tailwind)
│   ├── auth-react/                  # SDK frontend de auth
│   ├── contracts/                   # Zod schemas + DTOs + tipos de eventos (semver)
│   ├── audit/                       # Nest Interceptor + decorator @Audited
│   ├── persistence/                 # Prisma base + tenant guard + repository base
│   ├── messaging/                   # Wrapper NATS JetStream + Outbox dispatcher
│   ├── observability/               # Pino + OpenTelemetry preset (Node + Web)
│   ├── testing/                     # Testcontainers presets, fixtures, helpers
│   ├── eslint-config/               # Configs ESLint (nest, react, lib)
│   ├── tsconfig/                    # tsconfig.base.json + variantes
│   └── tailwind-config/             # Preset Tailwind 4 compartilhado
│
├── tools/
│   ├── cli/                         # mais-inclusao CLI (provision tenant, seed, ops)
│   └── codegen/                     # Geradores: contracts → cliente HTTP tipado
│
├── infra/
│   ├── docker/
│   │   ├── dev/docker-compose.yml   # Stack dev: PG, Redis, NATS, MailHog, Jaeger, MinIO + APPS
│   │   └── images/*                 # Dockerfiles por app (multi-stage)
│   ├── k8s/                         # Manifests Helm/Kustomize (Onda 2+)
│   └── terraform/                   # IaC cloud (Onda 2+)
│
├── docs/
│   ├── adr/                         # Architecture Decision Records (imutáveis)
│   ├── architecture/                # Diagramas C4, runbooks, padrões
│   ├── legal/                       # ROPA, DPA, templates, subprocessors
│   ├── security/                    # Incident response, postmortems
│   └── superpowers/specs/           # Specs vindas dos brainstormings (este aqui)
│
├── .github/
│   ├── workflows/                   # ci, e2e, release, codeql
│   └── dependabot.yml               # Suporte oficial a pnpm
│
├── .changeset/                      # Gerência de versões dos packages internos
│
├── turbo.json                       # Pipelines Turborepo
├── package.json                     # packageManager: pnpm@11.1.2
├── pnpm-workspace.yaml              # apps/* packages/* tools/*
├── tsconfig.json                    # Project references
├── .editorconfig · .nvmrc · .gitignore · .prettierrc
├── README.md · CONTRIBUTING.md · CODE-OF-CONDUCT.md · LICENSE · SECURITY.md
```

### Pipelines do `turbo.json`

| Pipeline | dependsOn | outputs | notas |
|---|---|---|---|
| `build` | `^build` | `dist/**`, `.rspack/**` | Compila TS e gera artefatos. |
| `dev` | — | (none, persistent: true) | Watch em paralelo. |
| `lint` | — | — | ESLint via `@mais-inclusao/eslint-config`. |
| `typecheck` | `^typecheck` | — | `tsc --noEmit`. |
| `test` | `^build` | `coverage/**` | Vitest + RTL. |
| `test:integration` | `^build` | — | Testcontainers (PG, NATS, Redis). |
| `e2e` | — | (cache: false) | Playwright; só em main / PR com label `e2e`. |
| `db:migrate` | — | (cache: false) | `prisma migrate deploy` por serviço. |
| `db:generate` | — | `node_modules/.prisma/**` | `prisma generate`. |
| `contracts:codegen` | — | `dist/codegen/**` | Gera cliente HTTP tipado. |
| `format` | — | (cache: false) | Prettier; roda em pre-commit. |
| `release` | — | — | Changesets version + build + publish + tag; só em main, gated por approval. |

### Tooling compartilhado

| Ferramenta | Decisão | Por quê |
|---|---|---|
| Package manager | **pnpm 11.1.2 via corepack** | Evita phantom dependencies em `packages/contracts` (crítico em MF singletons); install em CI ~3× mais rápido; isolamento de deps por workspace via symlinks. |
| Monorepo | Turborepo 2.9+ | Cache local + remote (Onda 2). |
| TypeScript | 5.6+ strict | Project references no root. |
| ESLint | 9 flat config em `packages/eslint-config` | Plugins: typescript, react, jsx-a11y, security. |
| Prettier | 3 + plugin Tailwind | Config raiz única. |
| Husky + lint-staged | Pre-commit | Format + lint dos arquivos staged. Sem typecheck. |
| commitlint + Commitizen | Conventional Commits | Obrigatório. `cz` para composição. |
| Changesets | Gerência de versão | `packages/contracts` é o ponto sensível. |
| Dependabot | (não Renovate) | Hospedagem GitHub; suporte oficial a pnpm desde 2024; grupos para minor/patch. |
| syncpack | Dep version consistency | Zero drift entre workspaces. |
| EditorConfig + `.nvmrc` | Padronização | Node 24.x pin. |

### Ambiente de dev local — **dev-container purista**

Toda a stack (infra **e apps**) rodam containerizadas via `infra/docker/dev/docker-compose.yml`:

| Serviço container | Função |
|---|---|
| `postgres:16-alpine` | Porta 5432. Init script cria 1 banco por serviço. |
| `redis:7-alpine` | Porta 6379. Sessões + rate limit + locks. |
| `nats:2.10-alpine` | JetStream habilitado. Porta 4222 (clients), 8222 (admin). |
| `mailhog` | SMTP fake para Notifications (UI em :8025). |
| `jaegertracing/all-in-one` | UI :16686 para visualizar traces OTel localmente. |
| `minio` | S3-compatible para Documents (Onda 2). Pre-provisionado para teste. |
| `adminer` | UI :8080 para inspecionar PG durante dev. |
| `auth-service`, `programs-service`, `citizens-service`, `applications-service`, `bff-gestor`, `bff-cidadao`, `shell`, `gestor-mf`, `cidadao-mf` | Cada um em container próprio, com bind mount do código e volume nomeado para `node_modules`. |

**Why dev-container purista:** paridade dev/prod absoluta, sem "funciona na minha máquina". Penalidade de file-watching via virtiofs não se aplica (usuário em Linux nativo).

Comandos: `pnpm infra:up` (sobe o compose), `pnpm dev` (orquestra Turbo em watch — agora dentro dos containers via `docker compose exec`), `pnpm db:migrate`, `pnpm seed`.

### CI mínimo — `.github/workflows/`

| Workflow | Trigger | O que faz |
|---|---|---|
| `ci.yml` | PR + push main | Setup Node 24 + pnpm + Turbo cache → lint, typecheck, test em paralelo → build incremental. |
| `e2e.yml` | PR com label `e2e`, push main | Playwright contra docker-compose dev. |
| `release.yml` | push main | Changesets version PR → publish + tag + build images. Gated por approval manual. |
| `codeql.yml` | schedule + PR | Security scan estático + `pnpm audit`. Falha em high/critical. |

### Decisões transversais do monorepo

1. **pnpm em vez de npm** após análise concreta dos riscos (phantom deps em `packages/contracts`, hoisting imprevisível com singletons MF, tempo de install em CI).
2. **`tools/` separado de `packages/`** — CLIs internas e codegen fora do grafo de deploy.
3. **`packages/contracts` é o ponto sensível** — toda alteração entra em changeset; consumidores rodam contract tests no CI.
4. **Dev-container purista** — apps Nest/Rspack também containerizados; paridade dev/prod absoluta.
5. **`tools/cli` faz provisionamento na Onda 1** — comandos como `mais-inclusao tenant:create`, `user:create`, `seed` evitam construir UI admin antes da Onda 3.

---

## Seção 4 — Contratos, eventos, sagas e Outbox

### Estrutura de `packages/contracts/`

```
packages/contracts/src/
├── shared/
│   ├── event-envelope.ts     # EventEnvelope, EventHeaders
│   ├── pagination.ts
│   ├── error.ts              # RFC 9457 Problem Details
│   └── tenant.ts
├── auth/
│   ├── http.ts
│   ├── events.ts
│   └── index.ts
├── programs/
│   ├── http.ts
│   ├── events.ts
│   └── index.ts
├── citizens/{http,events,index}.ts
├── applications/
│   ├── http.ts
│   ├── events.ts
│   ├── state-machine.ts      # transições + guards
│   └── index.ts
└── index.ts
```

### Envelope de evento — obrigatório

```typescript
// packages/contracts/src/shared/event-envelope.ts
import { z } from "zod";

export const EventHeadersSchema = z.object({
  event_id:       z.string().uuid(),                        // idempotency key — NATS Msg-ID
  event_type:     z.string().regex(/^[a-z]+\.[a-z_]+\.[a-z_]+$/),
  event_version:  z.string().regex(/^\d+\.\d+\.\d+$/),      // SemVer do payload
  occurred_at:    z.string().datetime(),
  tenant_id:      z.string().uuid(),                        // INVARIANTE
  correlation_id: z.string().uuid(),
  causation_id:   z.string().uuid().optional(),
  producer:       z.string(),
});

export const EventEnvelopeSchema = <T extends z.ZodTypeAny>(payload: T) =>
  z.object({ headers: EventHeadersSchema, payload });
```

### 8 convenções não-negociáveis

1. **Naming de evento:** `<context>.<entity>.<event>` em snake_case (ex: `applications.application.submitted`).
2. **Thin events:** payload carrega apenas IDs e o que mudou. Consumer faz lookup se quiser detalhes.
3. **Idempotência:** consumer mantém `processed_events` com PK = `event_id`. Receber duas vezes = no-op silencioso.
4. **`tenant_id` obrigatório** em todo header. Consumer rejeita evento sem ele.
5. **Versionamento SemVer:** mudança incompatível → major; campo opcional → minor; bug fix → patch. `event_version` no header permite upcaster.
6. **Validação dupla:** publicador valida antes do outbox; consumer valida antes de processar.
7. **Sem evento ⇄ evento:** consumir um evento NÃO publica outro sem antes mudar estado do aggregate.
8. **Topic naming NATS:** `mais-inclusao.<env>.events.<context>` (ex: `mais-inclusao.prod.events.applications`). Stream JetStream por context.

### Outbox Pattern

**Esquema:**

```prisma
model OutboxEvent {
  id              String   @id @default(uuid())     // vira NATS Msg-ID
  aggregate_type  String                            // "Application", "Program", ...
  aggregate_id    String
  event_type      String                            // "applications.application.submitted"
  event_version   String                            // "1.0.0"
  payload         Json                              // validado contra schema do contracts
  headers         Json                              // EventHeaders
  tenant_id       String
  status          OutboxStatus @default(pending)    // pending | dispatched | failed
  attempts        Int      @default(0)
  last_error      String?
  created_at      DateTime @default(now())
  dispatched_at   DateTime?

  @@index([status, created_at])
  @@index([tenant_id])
  @@map("outbox_event")
}
```

**Fluxo:**
1. BFF chama serviço.
2. Serviço abre **transação única** Prisma: insere entidade + insere `outbox_event`.
3. Commit. 201 ao BFF.
4. Worker do mesmo serviço faz `SELECT FOR UPDATE SKIP LOCKED` em batch de 50.
5. Publica no NATS com `Msg-ID = outbox_event.id` (JetStream dedup window de 2 minutos garante exactly-once).
6. Após ack, marca `status = dispatched`.
7. Falhas: backoff exponencial (1s → 5s → 30s → 5min → 30min) até `attempts > 6` → DLQ.
8. Cleanup: outbox_event `dispatched` antigos são purgados (retenção configurável, default 7 dias).

### Saga coreografada — inscrição → triagem → concessão

A saga é **state-machine do próprio aggregate `Application`** — sem orquestrador externo na Onda 1. Cada transição é transação local que (a) muda o state, (b) grava no outbox, (c) publica o evento.

Sequência típica:

```
1.  Cidadão UI       → POST /inscricao              → bff-cidadao
2.  bff-cidadao      → POST /applications           → applications-service
3.  applications-svc → tx: insert Application(SUBMITTED) + outbox event
4.  applications-svc → NATS: applications.application.submitted
5.  NATS             → fan-out (Notifications Onda 2; self auto-triage)
6.  applications-svc → 201 Created → bff-cidadao → UI

—— mais tarde, gestor decide via UI ——

7.  Gestor UI        → POST /applications/:id/decision → bff-gestor
8.  applications-svc → tx: state IN_TRIAGE → APPROVED + outbox event
9.  applications-svc → NATS: applications.triage.completed
10. applications-svc → tx: state APPROVED → GRANTED + outbox event
11. applications-svc → NATS: applications.application.granted
12. NATS → Notifications (Onda 2) → SMS/email cidadão
```

**Compensação na Onda 2:** quando `delivery-service` entrar, alguns fluxos vão precisar de rollback semântico (cidadão não compareceu → revogar Grant). Aí entra evento `delivery.no_show` consumido por `applications-service` que move state para `REVOKED`. Sem 2PC, sem orquestrador externo.

### Catálogo de eventos da Onda 1

| Evento | Produtor | Consumidores Onda 1 | Trigger |
|---|---|---|---|
| `auth.tenant.created` | auth-service | — | Operador provisionou tenant via CLI |
| `auth.tenant.deactivated` | auth-service | programs-service | Encerra programs órfãos |
| `auth.user.created` | auth-service | — | Gestor adicionou usuário |
| `auth.user.deactivated` | auth-service | applications-service | Reatribui applications em triagem |
| `programs.program.published` | programs-service | — | Program saiu de DRAFT |
| `programs.program.closed` | programs-service | applications-service | Cancela applications em DRAFT do programa |
| `programs.program.rules_updated` | programs-service | — | Auditoria |
| `citizens.citizen.created` | citizens-service | — | Novo cadastro |
| `citizens.citizen.updated` | citizens-service | — | Dados alterados |
| `citizens.vulnerability.declared` | citizens-service | — (Analytics Onda 3) | Autodeclaração |
| `applications.application.submitted` | applications-service | applications-service (self, auto-triage) | Inscrição enviada |
| `applications.triage.completed` | applications-service | — (Notifications Onda 2) | Triagem concluída |
| `applications.application.granted` | applications-service | — (Delivery+Notifications Onda 2; Analytics Onda 3) | Concessão final |
| `applications.application.rejected` | applications-service | — (Notifications Onda 2) | Decisão final negativa |

### Sync vs Async — regra dura

| Caso | Regra |
|---|---|
| BFF → serviço de domínio | **Sync** (sempre) |
| BFF → auth-service (login) | **Sync** |
| Serviço → auth-service (validar JWT) | **Sync** com cache de JWKS |
| Serviço de domínio → outro serviço de domínio | **PROIBIDO** — use eventos + read models locais |
| Mudança de estado relevante para outro contexto | **Async** (evento) |
| Side effect (notificação, integração, analytics) | **Async** |

**Read models locais:** se `applications-service` precisa saber se um program está PUBLISHED, mantém **cópia local read-only** de Program (id + status), atualizada por `program.published` / `program.closed`. Nunca chama programs-service por HTTP.

---

## Seção 5 — LGPD, multi-tenancy, segurança e acessibilidade

### Papéis LGPD

| Papel | Quem | Responsabilidade-chave | No +Inclusão |
|---|---|---|---|
| Controlador | Tenant (secretaria/ONG) | Decide finalidade e meios; presta contas à ANPD | Configura aviso de privacidade, bases legais por finalidade, DPO do tenant |
| Operador | +Inclusão SaaS | Trata dados conforme instruções do controlador; medidas de segurança; notifica em incidente | DPA por tenant; ROPA em `docs/legal/ropa.md`; logs de tratamento |
| Titular | Cidadão atendido | Exerce direitos do Art. 18; consente quando aplicável | Portal cidadão expõe direitos (Onda 2); aceites granulares |
| Sub-operador | Cloud, KMS, email/SMS | Trata dados em nome do operador | Lista pública em `docs/legal/subprocessors.md`; aprovação prévia do tenant |

### Bases legais por finalidade

| Finalidade | Dados | Base legal | Consentimento obrigatório? |
|---|---|---|---|
| Cadastro de cidadão pelo gestor | CPF, contato, endereço | Art. 7º III (políticas públicas) | Não para comuns; sim para sensíveis se houver opções |
| Autocadastro do cidadão | Idem + sensíveis autodeclarados | Art. 7º I + Art. 11 II 'a' (consentimento) | Sempre |
| Inscrição em programa | Vínculo a programa | Art. 7º III | Não — necessário para finalidade |
| Comunicação (SMS/email) | Telefone, e-mail | Art. 7º V (contrato) + IX (legítimo interesse) | Marketing sim; operacional não |
| Indicadores agregados | Pseudonimizado | Não aplicável (após anonimização efetiva) | Não |
| Auditoria interna | Logs de acesso a PII | Art. 7º IX (legítimo interesse) | Não, mas no ROPA |

### Direitos do titular — operacionalização

| Direito (Art. 18) | Onda |
|---|---|
| Confirmação | 1 |
| Acesso aos dados | 1 |
| Correção | 2 |
| Anonimização / Eliminação | 2 |
| Portabilidade | 2 |
| Eliminação de dados consentidos | 2 |
| Informação sobre compartilhamento | 2 |
| Revogação de consentimento | 2 |

### Multi-tenancy em 6 camadas de defesa em profundidade

1. **JWT carrega `tenant_id` claim.** Sem claim válido = 401. Refresh token é tenant-scoped.
2. **Guard de aplicação injeta `TenantContext`.** Nest Guard valida JWT + popula AsyncLocalStorage com `{ tenant_id, user_id, roles }`.
3. **Repository base filtra `tenant_id` automaticamente.** `packages/persistence` exporta `TenantAwareRepository<T>` que injeta `where: { tenant_id }`. Query sem contexto = `MissingTenantContextError`. Tentativa de bypass = `CrossTenantAccessAttempt` + alerta crítico.
4. **PostgreSQL Row Level Security (Onda 2).** Policy: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`. Connection pool faz `SET LOCAL` no início do request. Mesmo se app esquecer, banco rejeita.
5. **Eventos carregam `tenant_id` no header obrigatório.** Consumer rejeita evento sem ele.
6. **Testes E2E de isolamento + métrica `tenant_id_mismatch_total`.** Suite que tenta cross-tenant access; alerta crítico se métrica > 0 em produção.

### Classificação de dados (4 níveis)

| Nível | Exemplo | Criptografia | Log | Audit |
|---|---|---|---|---|
| L0 — Público | Programas publicados, descrição | TLS apenas | Livre | — |
| L1 — Interno | Configuração, papéis, métricas | TLS+TLS | IDs redacted | Mudanças |
| L2 — PII sensível | CPF, nome, contato, endereço | Coluna AES-256-GCM (KEK por tenant) | PROIBIDO | Todo acesso |
| L3 — PII altamente sensível (Art. 11) | Raça, gênero, deficiência, saúde | Coluna + chave separada | PROIBIDO | Todo acesso + revisão mensal |

**Chaves de criptografia:** 1 KEK (Key Encryption Key) por tenant em KMS/Vault; DEK (Data Encryption Key) por linha gerada via HKDF; rotação anual da KEK; DEKs antigas permanecem decifráveis. CPF tem hash determinístico (HMAC-SHA256 com pepper global) em coluna separada para busca sem decifrar.

### Segurança técnica

| Área | Onda 1 | Evolução |
|---|---|---|
| Rede | TLS 1.3, HSTS, WAF na frente do BFF Cidadão, rate limit (30 req/min IP, 100 req/h CPF) | mTLS interno + Istio Onda 2 |
| Auth gestor | OIDC interno, JWT 15min + refresh 7d rotation, argon2id | MFA opcional Onda 2 (TOTP/WebAuthn); SSO empresarial Onda 3 |
| Auth cidadão | E-mail+CPF+senha | Gov.br + magic link Onda 2 |
| Autorização | RBAC por tenant + permission strings | ABAC Onda 3 |
| Secrets | `.env.local` em dev (gitignore + pre-commit validation); Vault/KMS em prod | Verificação de assinaturas npm Onda 2 |
| Input | Zod + DOMPurify + Prisma | — |
| Output | PII nunca em log; CSP rígido, HSTS, X-Frame-Options DENY, CSRF, CORS explícito | — |
| Supply chain | Dependabot, `pnpm audit`, Snyk no CI, SBOM em release | — |
| Detecção | Pino → Loki/ELK; métricas críticas (tenant_id_mismatch, auth_failed, pii_access); OTel | Notificação ANPD 72h Onda 2 |
| Testes seg | CodeQL no CI | DAST OWASP ZAP Onda 2; pentest bianual Onda 3; bug bounty Onda 3+ |
| Backup | PG WAL contínuo + snapshots diários (retenção 30 dias) | DR RPO 15min/RTO 4h Onda 2; restore por tenant Onda 3; drill trimestral Onda 3 |

### Acessibilidade — operação contínua

| Prática | Onda |
|---|---|
| DoD com axe-core pass + checklist a11y | 1 |
| Componentes em `packages/ui` com `@testing-library/jest-axe` | 1 |
| SLA P0=24h, P1=1 semana para `a11y-bug` | 1 |
| VLibras plugin Gov.br | 2 |
| Revisão editorial de linguagem cidadã | 2 |
| Audiodescrição estruturada em conteúdo programático | 3 |
| Acessibilidade cognitiva (WCAG Cognitive AT) | 3 |
| Auditoria externa anual com selo (ABNT/W3C) | 3 |

### Governança de dados

| Artefato | Local | Atualização |
|---|---|---|
| ROPA | `docs/legal/ropa.md` | PR que mexe em PII exige atualização (CI rule) |
| Política de retenção automatizada | Cron jobs por serviço | Onda 2 |
| Anonimização para analytics | Pseudonimização determinística com pepper separado | Onda 3 |
| RIPD | `docs/legal/ripd-template.md` | Onda 2; revisão anual |
| Termos e avisos por tenant | `docs/legal/templates/` | Versionado + hash do termo no aceite |
| Lista de sub-operadores | `docs/legal/subprocessors.md` | Notificação aos tenants com 30 dias |

### Incident response

| Severidade | Exemplos | SLA |
|---|---|---|
| P0 — Crítico | Cross-tenant leak, vazamento PII >100 cidadãos, comprometimento admin | Detecção imediata; contenção 1h; ANPD 72h |
| P1 — Alto | Falha de auth em prod, PII em log, bug que permite acesso não autorizado | Detecção 15min; contenção 4h; postmortem 7 dias |
| P2/P3 — Médio/Baixo | Bug a11y P0, métrica não-crítica, CVE médio | Dias a semanas |

Postmortem blameless obrigatório para P0/P1. Template em `docs/security/postmortem-template.md`. Action items rastreados em issues com label `postmortem-followup`.

### Decisões transversais da Seção 5

1. **Multi-tenant via discriminator `tenant_id`**, não schema-per/DB-per-tenant. Operacionalmente sustentável. Schema/DB-per-tenant entra como opção contratual para tenants enterprise na Onda 3.
2. **Criptografia de PII em coluna**, com KEK por tenant em KMS/Vault.
3. **Aceites granulares de consentimento**, não "aceito tudo".
4. **RLS PostgreSQL como defesa em profundidade Onda 2**, não única camada.
5. **ROPA versionado no monorepo**, com CI rule de path-touch.

---

## Seção 6 — Ondas seguintes e gatilhos de extração

### Princípio: extração por evidência

Extrair um módulo para serviço próprio só é justificado quando **pelo menos um** dos gatilhos abaixo é verdadeiro. Extrair "porque DDD manda" é cargo cult.

### 6 gatilhos concretos

| Gatilho | Condição que dispara |
|---|---|
| 📈 Pressão de escala | p99 do módulo > 500ms **e** p99 dos outros módulos correlaciona com X > 200ms |
| 👥 Pressão de time | > 3 colisões de PR no mesmo módulo em uma sprint |
| ⚖️ Pressão regulatória | Novo RIPD identifica retenção, criptografia ou audit distintos |
| 🧠 Pressão de domínio | > 3 ramificações condicionais por tenant_type / program_type |
| 🚀 Pressão de release cadence | > 50% dos deploys do serviço bloqueados pelo módulo |
| 🧪 Pressão de teste | Tempo de CI > 15min **e** > 50% causado pelos testes do módulo |

### Onda 2 — operação real + privacidade (7 novos contextos)

Disparada quando o MVP estiver atendendo primeiros tenants reais.

- `citizen-identity-service` — autenticação cidadã extraída do bff; Gov.br plugável, magic link, recovery.
- `notifications-service` — consumidor de eventos → SMS/email/WhatsApp; templates por tenant; fila persistente.
- `documents-service` — storage S3-compatible para anexos; criptografia em repouso; lifecycle conforme LGPD; AV scan.
- `case-notes-service` — diário operacional de atendimento.
- `consent-service` (LGPD operacional) — aceites granulares, ROPA digital, direitos do titular automatizados.
- `identity-resolution-service` — matching/merging cross-canal; determinístico + probabilístico; trilha reversível.
- `delivery-service` — extraído de applications; agendamento, retirada, comprovação, no-show com compensação (REVOKED).
- `cidadao-mf (full)` — substitui o "light"; Gov.br, autoatendimento LGPD, notificações in-app, PWA offline-aware.

**Cross-cutting Onda 2:** MFA opcional para gestor · mTLS interno · RLS PostgreSQL · DAST OWASP ZAP · DR RPO 15min/RTO 4h · RIPD inicial · DPA finalizado · backup criptografado com chave separada.

### Onda 3 — governança e escala (7 novos contextos + 3 extrações)

Disparada por >3 tenants pagantes, >100k cidadãos cadastrados, ou exigência contratual de relatório consolidado.

- `eligibility-service` (dedicado) — extraído de programs quando regras > 5 ramos condicionais. Simulação de impacto.
- `referrals-service` — encaminhamentos entre programas e tenants conveniados.
- `territory-service` — geolocalização, setores censitários, busca ativa; integração IBGE/OpenStreetMap.
- `analytics-service` — BI sobre dados pseudonimizados; Lakehouse (Iceberg/Delta Lake) + DBT.
- `search-service` — indexação cross-context (Meilisearch ou OpenSearch).
- `etl-service` — ingestão CadÚnico, planilhas, APIs; conectores plugáveis.
- `billing-service` — planos, faturas, gateway (Stripe ou Iugu).
- `feature-flags-service` — Unleash ou OpenFeature self-hosted.
- `audit-service` (dedicado) — extrai capability transversal; storage especializado, retenção legal por tenant, export para auditor externo.
- `admin-platform-mf` — super-admin; substitui CLI `tools/cli`.

**Cross-cutting Onda 3:** VLibras + audiodescrição + acessibilidade cognitiva · pentest bianual · bug bounty · ABAC · DR drill trimestral · restore por tenant · certificação alvo (ISO 27001 ou SOC 2 Type I) · revisão jurídica anual.

### Ondas 4+ — visão (sem promessa)

- Open Data público (transparência ativa, CC-BY 4.0)
- API pública para parceiros (OAuth2 client credentials)
- ML para priorização de busca ativa **com governança ética obrigatória** (auditoria de viés, modelo explicável, review humana antes de qualquer decisão automatizada)
- Simulador de impacto orçamentário
- Integração Gov.br DadosAbertos (consumir + publicar)
- Federação entre tenants (cidadão referenciado entre municípios com consentimento explícito)

### 6 anti-padrões — quando NÃO extrair

| Sinal | Por que veta |
|---|---|
| Aggregate fragmentado entre 2+ serviços | Você está dividindo no lugar errado |
| Joins frequentes entre serviços | Custo de read models locais ou sync calls supera ganho |
| Cadeia síncrona crítica | Fragilidade composta; latency-sensitive flow |
| Falta de time para manter dois serviços | Cada microsserviço novo tem custo fixo (pipeline, observability, on-call) |
| Sem evento natural para integrar | Talvez não seja bounded context independente — é módulo do mesmo |
| Migração de dados não-trivial sem ganho proporcional | Operação delicada não justificada |

### Decisões transversais da Seção 6

1. **Onda 2 disparada por evidência operacional**, não por calendário. Só comece quando MVP estiver atendendo primeiros tenants reais.
2. **Onda 3 disparada por escala ou contrato.** Não construir analytics sem demanda; billing sem tenant pagante é dívida.
3. **Anti-padrões têm peso de veto.** Mesmo com gatilho positivo, presença de anti-padrão bloqueia extração.
4. **Ondas 4+ são visão, não promessa.** Não comprometer Ondas 1–3 perseguindo Open Data ou ML.

---

## Próximos passos

1. **Adicionar `.gitignore`** com `.superpowers/`, `node_modules/`, `.turbo/`, `dist/`, `coverage/`, `.env*`, etc.
2. **Commit inicial** do repositório com: este spec + ajustes do `package.json` (`packageManager: pnpm@11.1.2`) + `pnpm-workspace.yaml` + `.gitignore`. Convenção de commit: `chore: initial commit — decomposition spec + pnpm migration`.
3. **Escolher subprojeto inicial da Onda 1** para o primeiro ciclo `brainstorming → spec → plano → implementação`. Recomendação fundamentada (ver Apêndice D).
4. **Próxima sessão de brainstorming** começa pelo subprojeto escolhido. Esta spec é referência mas o próximo design vai para `docs/superpowers/specs/<data>-<subprojeto>-design.md`.

---

## Apêndices

### Apêndice A — Catálogo consolidado de eventos (Onda 1)

Ver Seção 4 acima. Resumo: 14 eventos publicados em 4 contextos (auth, programs, citizens, applications). Cada um vai virar arquivo em `packages/contracts/src/<context>/events.ts`.

### Apêndice B — Decisões de tooling consolidadas

| Decisão | Escolha | Justificativa |
|---|---|---|
| Package manager | pnpm 11.1.2 via corepack | Evita phantom deps em `packages/contracts`; isolamento via symlinks |
| Monorepo | Turborepo 2.9+ | Cache local + remote (Onda 2) |
| Linguagem | TypeScript 5.6+ strict | Project references |
| Backend framework | NestJS 11 | DI, modularidade, ecossistema MS |
| ORM | Prisma 6 | DX, migrações declarativas |
| Banco | PostgreSQL 16 (1 schema/serviço, mesmo cluster) | RLS disponível para Onda 2 |
| Mensageria | NATS JetStream | Leve, durável, ack semantics |
| Cache/sessão | Redis 7 | Sessões + rate limit + locks |
| Bundler frontend | Rspack + Module Federation 2.0 | Performance + typing de remotes |
| UI framework | React 19 (CSR) | Ecossistema MF maduro |
| Roteamento frontend | React Router v7 (data router) | Estado nativo |
| Server state | TanStack Query v5 | Idiomático para REST |
| UI state | Zustand | Mínimo, sem boilerplate |
| Estilo | Tailwind CSS 4 + shadcn/ui copiado | Controle total, zero runtime extra |
| Forms | React Hook Form + Zod resolver | Compartilha schemas com `packages/contracts` |
| i18n | react-i18next (pt-BR único Onda 1) | Preparado para multi-locale |
| Bot de updates | Dependabot (suporte oficial pnpm) | Hospedagem GitHub |
| CI | GitHub Actions (ci, e2e, release, codeql) | Hospedagem GitHub |
| Versão de pacotes internos | Changesets | Flexibilidade em monorepo |
| Testes | Vitest + RTL + Testcontainers + Pact + Playwright + `@axe-core/playwright` | Cobre unit, integração, contrato, E2E, a11y |
| Observabilidade | Pino + OpenTelemetry | Padrão de mercado, vendor-neutro |
| Ambiente dev | Dev-container purista (docker-compose com apps + infra) | Paridade dev/prod absoluta |
| Convenção de commit | Conventional Commits via commitlint + Commitizen | Geração automática de changelog |

### Apêndice C — Glossário

| Termo | Definição |
|---|---|
| **Aggregate** | Cluster de entidades + valores tratado como unidade transacional (DDD). |
| **BFF** | Backend for Frontend — gateway HTTP que agrega chamadas a serviços de domínio para um frontend específico. |
| **Bounded context** | Fronteira semântica em que um modelo de domínio se aplica (DDD). |
| **Choreography** | Padrão de saga em que cada serviço reage a eventos sem coordenação central. |
| **Controlador (LGPD)** | Pessoa natural/jurídica que decide finalidade e meios do tratamento (Art. 5º VI). |
| **DEK / KEK** | Data Encryption Key / Key Encryption Key — hierarquia de chaves para criptografia em coluna. |
| **DPA** | Data Processing Agreement — contrato entre controlador e operador. |
| **MF (Module Federation)** | Arquitetura de micro frontends com carregamento de remotes em runtime. |
| **Operador (LGPD)** | Pessoa que trata dados em nome do controlador (Art. 5º X). |
| **Outbox Pattern** | Padrão para garantir consistência transacional entre banco e mensageria sem 2PC. |
| **RIPD** | Relatório de Impacto à Proteção de Dados Pessoais (LGPD). |
| **RLS** | Row Level Security — política PostgreSQL de filtragem por linha. |
| **ROPA** | Registro de Operações de Tratamento de Dados Pessoais (LGPD). |
| **Tenant** | Cliente isolado em SaaS multi-tenant. |
| **Titular (LGPD)** | Pessoa natural a quem se referem os dados pessoais (Art. 5º V). |
| **VLibras** | Plugin oficial Gov.br para tradução de Libras (Língua Brasileira de Sinais). |

### Apêndice D — Recomendação de subprojeto inicial

Para o próximo ciclo `brainstorming → spec → plano → implementação`, recomendamos começar por **um dos dois caminhos**:

1. **Caminho técnico de fundação:** `packages/contracts` + `packages/persistence` + `packages/messaging` + `packages/audit`. **Por quê:** sem isto, todos os serviços vão duplicar lógica de tenant guard, outbox, eventos, audit. Fazer primeiro economiza retrabalho. Custo: ~1–2 semanas de trabalho preparatório antes de qualquer feature de produto.

2. **Caminho de valor de produto:** `auth-service` (com persistência inline). **Por quê:** sem auth, nada funciona. É o serviço com menor número de dependências externas (não consome eventos) e o primeiro que precisa ficar de pé para qualquer outro avançar. Custo: o serviço carrega lógica de tenant/outbox/audit que será refatorada para os packages depois.

**Recomendação concreta:** Caminho 1 (fundação). É contra-intuitivo (parece "sem entrega") mas reduz retrabalho em ~30% no curto prazo e estabelece os contratos antes que os serviços os tornem rígidos. Caminho 2 fica para o ciclo seguinte.

### Apêndice E — Decisões revertidas durante o brainstorming

| Decisão original | Revertida para | Razão |
|---|---|---|
| Manter `npm` 11 | Migrar para `pnpm@11.1.2` | Após explicação detalhada do trade-off concreto (phantom deps em `packages/contracts`, hoisting imprevisível com MF singletons, tempo de install em CI), o usuário autorizou a migração. Já executada: `package.json` atualizado, `pnpm-workspace.yaml` criado, `package-lock.json` removido, `pnpm install` rodou em 3.2s. |
| Renovate | Dependabot | Hospedagem no GitHub torna Dependabot mais integrado; suporte oficial a pnpm desde 2024. |
| Apps Nest/Rspack fora do Docker em dev | Dev-container purista (tudo containerizado) | Paridade dev/prod absoluta solicitada pelo usuário. Linux nativo evita penalidade de file-watching via virtiofs. |

### Apêndice F — Decisões pendentes

Pontos cuja decisão final ainda não foi tomada e ficam para os ciclos de spec dos subprojetos:

1. **KMS específico para criptografia de PII**: AWS KMS, GCP KMS ou HashiCorp Vault self-hosted? (Depende da cloud escolhida para produção.)
2. **Polling vs LISTEN/NOTIFY no worker do Outbox**: poll é simples e suficiente para Onda 1; LISTEN/NOTIFY reduz latência mas adiciona código.
3. **Topic granularity NATS**: por context (`...events.applications`) ou por event_type? Adotado por context na Onda 1; revisar se subscribers ficarem muito heterogêneos.
4. **Schema-per-tenant para enterprise**: opção contratual na Onda 3 ou Onda 1?
5. **Pgcrypto com chave em env vs KMS externo na Onda 1**: simplificação aceitável para MVP sem tenant pagante real?
6. **RLS PostgreSQL na Onda 1 (não Onda 2)**: vale a pena puxar para a Onda 1 a defesa em profundidade?
7. **Storybook na Onda 1 ou Onda 2**: custo vs valor para 3 apps iniciais.
8. **SSR/SSG do portal cidadão**: shell com SSG vs introduzir Astro/Next como terceira app para o portal cidadão se SEO local for crítico.
9. **Saga orquestrada vs coreografada na Onda 1**: introduzir Temporal/NestJS Saga library para auditabilidade ou manter coreografia?
10. **Pentest e bug bounty na Onda 2 vs Onda 3**: pode atrasar certificações exigidas por tenants enterprise.

---

*Fim do documento. Próximo artefato: `docs/superpowers/specs/<data>-<subprojeto>-design.md`.*
