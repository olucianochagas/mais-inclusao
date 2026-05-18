# ADR-0003: Monorepo Turborepo + pnpm 11.1.2 via corepack

- **Status:** accepted
- **Data:** 2026-05-16
- **Decisores:** @olucianochagas
- **Tags:** tooling, monorepo, fundacional

---

## Contexto

O +Inclusão comporta múltiplos artefatos que evoluem juntos: 4 microsserviços de domínio + 2 BFFs + 3 apps Module Federation + 11 packages internos compartilhados + 2 ferramentas internas (CLI, codegen) na Onda 1, com previsão de crescimento em Ondas 2 e 3.

Considerando:

- **Contratos públicos** (`packages/contracts`) precisam ser **consumidos por todos os serviços** com versionamento explícito — não dá para ser repo separado sem inflar overhead de release.
- **Configurações de tooling** (ESLint, TypeScript base, Tailwind preset) precisam ser **compartilhadas** sem cópia manual entre repos.
- **Cache de build** entre desenvolvimentos e CI é crítico para velocidade (testes Testcontainers são caros).
- **CI deve buildar apenas o que foi afetado** pela mudança — em monorepo com ~20 workspaces, buildar tudo a cada PR seria proibitivo.

A pergunta concreta: **qual orquestrador de monorepo, qual gerenciador de pacotes?**

## Decisão

**Adotar Turborepo 2.9+ como orquestrador e pnpm 11.1.2 (via corepack) como gerenciador de pacotes.**

Concretamente:

1. **Workspaces**: `apps/*`, `packages/*`, `tools/*` declarados em `pnpm-workspace.yaml`.
2. **Tasks (pipelines)** declarados em `turbo.json`: `build`, `dev`, `lint`, `typecheck`, `test`, `test:integration`, `e2e`, `db:migrate`, `db:generate`, `contracts:codegen`, `format`, `format:check`, `seed`, `clean`.
3. **Cache do Turborepo** local (Onda 1); remote cache (Onda 2) quando justificado por tempo de equipe.
4. **Catalog do pnpm** (recurso pnpm 11) versiona deps compartilhadas — workspaces referenciam com `catalog:` em vez de literal, eliminando drift.
5. **`onlyBuiltDependencies`** restringe quais pacotes podem executar scripts postinstall — defesa contra supply chain attack (LGPD-sensível).
6. **Conventional Commits + Changesets** complementam (ADR-0008).

## Consequências

### Positivas

- **Cache do Turborepo** elimina recomputação. Em build incremental, Turborepo identifica apenas o que mudou e reutiliza o resto. Acelera drasticamente CI e dev.
- **pnpm em monorepo** é dramaticamente superior a npm:
  - **Phantom dependencies eliminadas** por design (symlinks isolados). Crítico para `packages/contracts` que serve consumers.
  - **Install ~3x mais rápido** que npm em CI.
  - **Disco ~50% menor** via content-addressable store.
  - **Hoisting previsível** com peer dependencies (essencial para singletons MF).
- **Catalog centraliza versões** de React, NestJS, Prisma, etc. Não há mais workspace usando React 19.0.1 enquanto outro usa 19.0.2.
- **`onlyBuiltDependencies`** bloqueia execução de postinstall de pacotes não-listados — segurança supply chain.
- **`corepack`** garante que toda a equipe use **exatamente** `pnpm@11.1.2` sem instalação manual.

### Negativas

- **Aprendizado de Turborepo**: declarar tasks com `dependsOn`, `inputs`, `outputs`, `cache` corretamente exige leitura. Erros silenciosos (cache não invalidando quando deveria) são possíveis.
- **`onlyBuiltDependencies` requer manutenção**: cada nova dep com postinstall precisa ser adicionada. PR rejeitado por padrão é defesa em profundidade mas adiciona fricção.
- **pnpm em algumas ferramentas terceiras**: ferramentas que assumem `node_modules` hoisted (npm-style) precisam de config extra ou `shamefullyHoist` (que desabilitamos por segurança).
- **Catalog requer pnpm 9.5+**: trava versão mínima do pnpm.

### Neutras

- A migração de `npm` → `pnpm` foi feita **antes** do primeiro commit. Não há histórico de `npm` no repo, simplificando contribuição.

## Alternativas consideradas

### Alternativa A — npm workspaces

**Resumo**: Padrão nativo do Node, sem ferramenta adicional.

**Por que rejeitada**:

- **Phantom dependencies** silenciosas no hoisting plano do npm são bug latente em `packages/contracts` (Seção 3 da spec detalha o cenário).
- Install ~3x mais lento em CI (ver impacto em PRs).
- Hoisting imprevisível com peer deps gera divergências sutis entre workspaces — em MF com singletons, isso é particularmente perigoso.

### Alternativa B — Yarn (Berry / PnP)

**Resumo**: Yarn 4 com Plug'n'Play.

**Por que rejeitada**:

- PnP altera o resolution mechanism do Node — quebra ferramentas terceiras (especialmente Prisma, ESLint plugins, alguns transpilers).
- Comunidade Yarn 4 menor que pnpm em 2026.
- Sem ganho funcional sobre pnpm.

### Alternativa C — Nx em vez de Turborepo

**Resumo**: Alternativa mais "opinionated" com generators e scaffolders.

**Por que rejeitada**:

- Generators e scaffolders são úteis mas vinculam o projeto a um modelo de organização específico — fricção para flexibilidade.
- Curva de aprendizado maior; Turborepo é "thin orchestrator" (apenas grafo + cache + execução paralela), mais fácil de adotar incrementalmente.
- Cache local do Turborepo já entrega o ganho principal sem amarras adicionais.

### Alternativa D — Multi-repo (polyrepo)

**Resumo**: Cada serviço/package em repo próprio.

**Por que rejeitada**:

- Versionamento de `packages/contracts` em polyrepo exige publicação a registry interno e bump manual em cada consumer — fricção desproporcional.
- Atomic commits que tocam múltiplos serviços (refactor cross-cutting, mudança coordenada) ficam impossíveis.
- Discoverability para contribuidores novos é pior.

## Referências

- [Spec de decomposição — Seção 3 (estrutura do monorepo)](../superpowers/specs/2026-05-16-programa-mais-inclusao-decomposicao.md#seção-3--estrutura-do-monorepo-turborepo)
- [Turborepo docs](https://turbo.build/repo/docs)
- [pnpm — Workspace](https://pnpm.io/workspaces) e [Catalogs](https://pnpm.io/catalogs)
- [pnpm — Why is the node_modules structure unique?](https://pnpm.io/symlinked-node-modules-structure)
- [corepack — Node.js docs](https://nodejs.org/api/corepack.html)
