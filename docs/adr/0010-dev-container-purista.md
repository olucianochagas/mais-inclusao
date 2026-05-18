# ADR-0010: Ambiente de desenvolvimento totalmente containerizado (dev-container purista)

- **Status:** accepted
- **Data:** 2026-05-16
- **Decisores:** @olucianochagas
- **Tags:** dev-experience, infra, devops, fundacional

---

## Contexto

O +Inclusão tem múltiplos serviços (NestJS, Rspack para frontends) que dependem de infraestrutura (Postgres 16, Redis 7, NATS JetStream, MailHog, Jaeger, MinIO). Em qualquer projeto Node moderno há dois caminhos típicos para dev local:

1. **Híbrido**: infra containerizada (PG, Redis, NATS), apps Node rodando nativamente na máquina.
2. **Purista**: tudo containerizado, incluindo apps Node.

Tradeoffs conhecidos:

|                              | Híbrido                                         | Purista                               |
| ---------------------------- | ----------------------------------------------- | ------------------------------------- |
| Velocidade de HMR            | Excelente (sem virtiofs)                        | Variável (depende da plataforma)      |
| Paridade dev/prod            | Baixa (diferenças sutis em libsystem, versões)  | **Alta** (mesma imagem)               |
| Setup inicial                | Médio (instalar Node, pnpm, locale do PG, etc.) | Mais simples (`docker compose up`)    |
| Onboarding novo contribuidor | Vários passos                                   | "Clone, suba os containers"           |
| Reprodutibilidade de bug     | Variável                                        | Alta                                  |
| Custo de RAM em dev          | Médio                                           | Alto                                  |
| Limitações em Mac/Windows    | Poucas                                          | virtiofs lento para file-watching     |
| Limitações em Linux nativo   | Poucas                                          | **Quase nenhuma** (bind mount nativo) |

Considerando:

- O usuário (e provavelmente futuros contribuidores brasileiros) está em **Linux nativo** — virtiofs/Mac/Windows não se aplica.
- A missão do projeto envolve **órgãos públicos** que frequentemente têm ambientes Windows e Linux mistos. Paridade dev/prod absoluta facilita reprodução de bugs.
- Onboarding simplificado para contribuidores novos é parte da missão de "equidade de oportunidade" (ver [CODE-OF-CONDUCT.md](../../CODE-OF-CONDUCT.md#3-equidade-de-oportunidade)).
- LGPD e tenant isolation são contextos onde **inconsistência entre dev e prod = bug crítico** — diferenças sutis em config de Postgres, encoding de cookie, locale, etc., podem virar incidente.

## Decisão

**Adotar dev-container purista: TODOS os apps (Nest e Rspack) rodam dentro de containers Docker em desenvolvimento local, além da infra.**

### Componentes

1. **`infra/docker/dev/docker-compose.yml`** sobe:
   - Infra: PostgreSQL 16, Redis 7, NATS 2.10 JetStream, MailHog, Jaeger, MinIO, Adminer.
   - Apps backend: `auth-service`, `programs-service`, `citizens-service`, `applications-service`, `bff-gestor`, `bff-cidadao`.
   - Apps frontend: `shell`, `gestor-mf`, `cidadao-mf`.
2. **Bind mount do código** (`./apps/<svc>:/app:cached`) permite HMR e watching nativos.
3. **Volume nomeado para `node_modules`** por app (`auth-service_node_modules`, etc.) evita conflito entre host e container.
4. **Dockerfile de dev** distinto do de prod:
   - Dev: imagem completa com tooling (`pnpm install` no container).
   - Prod: multi-stage (build no estágio buildem, runtime mínimo distroless).
5. **`pnpm dev`** orquestra via `docker compose exec` (após `docker compose up -d`).
6. **Não é necessário instalar Node, pnpm, ou qualquer dep do projeto na máquina física** do contribuidor — apenas Docker.

### Workflow esperado

```bash
git clone git@github.com:olucianochagas/mais-inclusao.git
cd mais-inclusao

# Sobe tudo
pnpm infra:up           # equivalente a: docker compose up -d

# Roda comandos dentro dos containers
pnpm dev                # orquestra dev em todos os apps via Turbo + docker compose exec
pnpm test               # idem para testes

# Para resetar e regerar do zero
pnpm infra:reset
```

## Consequências

### Positivas

- **Paridade dev/prod absoluta**: mesma imagem base, mesmas versões de runtime, mesma stack. "Funciona na minha máquina" deixa de ser desculpa.
- **Onboarding instantâneo**: contribuidor novo executa `pnpm infra:up && pnpm dev` e tem ambiente funcional em minutos, sem instalar Node ou conferir versão.
- **Reprodução de bug** trivial: anexar `docker compose logs <svc>` ao bug report já dá contexto completo.
- **Suporte a múltiplas versões** simultâneas: contribuidor pode rodar branch1 e branch2 em diretórios diferentes sem conflito de versão de Node.
- **Imagens prod podem ser construídas localmente** pelo mesmo `docker compose build` — não há divergência entre o que dev compilou e o que CI compila.
- **Inclusão técnica**: pessoas em máquinas mais modestas, com Windows + WSL, ou com versões de Linux diferentes, não enfrentam barreira.

### Negativas

- **Uso de RAM**: rodar 9 containers (4 services + 2 BFFs + shell + 2 remotes + ~5 infra) consome mais RAM que rodar Node nativamente. Em máquinas com 8GB, fica apertado. Em 16GB+, confortável.
- **HMR ligeiramente mais lento** em Linux nativo (poucos ms a mais via bind mount); significativamente mais lento em Mac/Windows (virtiofs ou similar). Mitigação para Mac/Windows: **opção híbrida documentada** como fallback para quem precisa, mas dev-container é padrão.
- **Curva de aprendizado de Docker**: contribuidor que nunca usou Docker precisa aprender o básico. Mitigação: CONTRIBUTING.md tem seção dedicada com comandos.
- **Custo de build de imagens locais**: primeira execução leva mais tempo (build de imagens). Mitigação: cache de layers do Docker absorve subsequentes.

### Neutras

- Como o usuário atual está em Linux nativo, a penalidade de file-watching não se aplica imediatamente — beneficia das vantagens sem sofrer com as desvantagens.
- A documentação prevê opção de "modo híbrido" para casos específicos (debug profundo de Node, profiling com ferramentas que exigem host); não é o padrão recomendado.

## Alternativas consideradas

### Alternativa A — Apenas infra containerizada (modelo híbrido)

**Resumo**: Postgres, Redis, NATS em containers; Nest e Rspack rodam direto no host com `pnpm dev`.

**Por que rejeitada**:

- Diferenças sutis entre Node local (versão minor, libsystem, locale) e Node de prod podem virar bugs.
- Onboarding requer instalar Node 24 com versão exata, garantir corepack, etc. — barreira para contribuidor novo.
- Linux nativo, Mac, Windows + WSL têm comportamentos sutilmente diferentes — falta paridade.

### Alternativa B — Dev Containers (devcontainer.json) sem docker-compose

**Resumo**: VS Code Dev Containers com um único container para todo o monorepo.

**Por que rejeitada**:

- Único container roda todos os serviços — perde isolamento, fica mais difícil simular falha de serviço específico.
- VS Code-specific (outros editores precisam de adaptação).
- docker-compose é mais flexível e amplamente suportado.

### Alternativa C — Nix / direnv para reprodutibilidade nativa

**Resumo**: Usar Nix para garantir reprodutibilidade sem containers.

**Por que rejeitada**:

- Curva de aprendizado de Nix é alta, e onboarding seria mais complexo, não mais simples.
- Não cobre infra (PG, Redis, NATS) — ainda precisaria de containers ou serviços nativos.
- Combinação Nix + Docker é overhead sem ganho proporcional para este projeto.

### Alternativa D — Tudo em VM (Vagrant)

**Resumo**: Uma VM dedicada para desenvolvimento (Ubuntu, etc.) com tudo instalado.

**Por que rejeitada**:

- Modelo Vagrant é antigo, comunidade enxugou nos últimos anos.
- VM consome mais recursos que containers.
- Sem ganhos sobre Docker.

## Referências

- [Spec de decomposição — Seção 3 (estrutura do monorepo, dev local)](../superpowers/specs/2026-05-16-programa-mais-inclusao-decomposicao.md#ambiente-de-dev-local--dev-container-purista)
- [Docker — Bind mounts](https://docs.docker.com/storage/bind-mounts/)
- [virtiofs in Docker Desktop](https://docs.docker.com/desktop/settings-and-maintenance/settings/#file-sharing) — sobre limitações em Mac/Windows.
- [The Twelve-Factor App — Dev/prod parity](https://12factor.net/dev-prod-parity)
