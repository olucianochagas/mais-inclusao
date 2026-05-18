# ADR-0002: Adotar Module Federation 2.0 + Rspack para frontends

- **Status:** accepted
- **Data:** 2026-05-16
- **Decisores:** @olucianochagas
- **Tags:** frontend, micro-frontends, build, rspack, module-federation

---

## Contexto

A spec do projeto define que os frontends do +Inclusão sigam arquitetura de **micro frontends Module Federation**. Há duas superfícies distintas com usuários e cookies separados:

- **Painel Gestor** — backoffice para servidores públicos.
- **Portal Cidadão** — interface pública para cidadãos atendidos, com requisitos pesados de acessibilidade (WCAG 2.2 AA) e SEO local.

Considerando:

- React 19 (CSR) já decidido como UI framework.
- Necessidade de **rollback rápido** de remotes em caso de regressão (sem rebuildar tudo).
- Necessidade de **type safety** entre shell e remotes (sem `any` solto na borda).
- Equipe pequena — não há orçamento para tooling exótico que ninguém mais usa.

Três bundlers foram avaliados:

|                         | Webpack 5 + MF           | Vite + plugin federation                                             | **Rspack 1.x + MF 2.0**                                    |
| ----------------------- | ------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| Maturidade MF           | Maturo, oficial original | Plugin terceiro (`@originjs/vite-plugin-federation`), instabilidades | Implementação oficial em Rust, evolução natural do Webpack |
| Performance build       | Lento (referência)       | Rápido em dev, médio em prod                                         | ~10x mais rápido que Webpack (compatível)                  |
| Type safety remotes     | Manual ou plugin         | Manual                                                               | Plugin oficial gera typings dos remotes                    |
| Compatibilidade Webpack | 100% (é o original)      | Quebra muita coisa                                                   | ~100% (drop-in para a maioria)                             |
| Comunidade 2026         | Em declínio              | Ainda imatura para MF de produção                                    | Ascendente, padrão de fato em MF                           |

## Decisão

**Adotar Module Federation 2.0 sobre Rspack 1.x** como combinação padrão para todos os frontends do +Inclusão.

Componentes concretos:

1. **Bundler**: `@rspack/core` + `@rspack/cli`.
2. **Federation**: `@module-federation/enhanced` (plugin oficial) + `@module-federation/runtime`.
3. **Shell host** (`apps/shell`) carrega remotes via **manifest publicado em CDN**, com nome estável por release imutável — habilita rollback instantâneo apontando manifest anterior.
4. **Shared singletons** com `strictVersion`: `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `@mais-inclusao/ui`, `@mais-inclusao/auth-react`.
5. **Type generation** dos remotes via plugin oficial — shell consome remotes com tipos resolvidos em build.
6. **Sem RSC nem SSR full** nesta onda. CSR + SSG do shell para landing pages do portal cidadão (SEO básico). Server Components fica como opção futura para Onda 3+.

## Consequências

### Positivas

- **Rollback instantâneo** por release: apontar o shell para o manifest anterior reverte sem rebuild — crítico para um sistema com cidadãos como público.
- **Type safety entre remotes** elimina classes de bugs onde shell e remote disagreem na shape de props ou retorno.
- **Performance de build em CI** ~10x melhor que Webpack — feedback loop mais curto, deploys mais rápidos.
- **Compatibilidade Webpack-like**: configurações, loaders, plugins funcionam como esperado para quem vem do ecossistema Webpack.
- **Comunidade Module Federation é majoritariamente React 2026** — alinhamento com onde a maioria da documentação e exemplos vivem.

### Negativas

- **Rspack é mais novo que Webpack** — em comportamentos exóticos (HMR de SCSS com modules complexos, certos plugins legados), pode haver edge cases.
- **MF 2.0 ainda evolui rápido**. Atualizações podem requerer adaptação de config.
- **Curva de aprendizado para quem nunca trabalhou com MF**: shared modules, version negotiation, exposures, manifest. Documentação compensa parcialmente.
- **Sem SSR/RSC**: SEO do portal cidadão fica dependente de SSG e sitemap. Para queries do tipo "auxílio em [cidade]", pode haver perda vs Next.js. Decisão consciente — RSC + MF ainda é território instável em 2026.

### Neutras

- O **design system `packages/ui`** vira shared singleton entre todos os remotes. Cada release de `packages/ui` impacta todos os frontends — exige rigor de Changeset (já há).
- O **carregamento dinâmico de remotes** depende de CDN acessível ao usuário. Em redes restritas (algumas instituições governamentais), isso pode requerer fallback local — não previsto na Onda 1.

## Alternativas consideradas

### Alternativa A — Webpack 5 + ModuleFederationPlugin

**Resumo**: Implementação clássica e mais documentada do MF.

**Por que rejeitada**:

- Performance de build significativamente pior. Em monorepo com múltiplos remotes, build em CI fica lento.
- Ecossistema Webpack está sendo gradualmente substituído por Rspack mesmo em projetos grandes (Bun, Vercel, ByteDance migraram).
- Não há ganho funcional que justifique o custo de performance.

### Alternativa B — Vite + @originjs/vite-plugin-federation

**Resumo**: Vite (dev experience excelente) com plugin community-maintained de Module Federation.

**Por que rejeitada**:

- Plugin não é oficial e tem histórico de instabilidades em casos de produção.
- Suporte a MF 2.0 (rollback por manifest, type generation) é limitado.
- Mais arriscado para um projeto que precisa servir cidadãos de forma confiável.

### Alternativa C — Single Page App único (sem MF)

**Resumo**: 1 SPA que serve gestor e cidadão, com code splitting por rota.

**Por que rejeitada**:

- Conflita com o requisito explícito de micro frontends do projeto.
- Acoplamento de release: bug no gestor força redeploy do portal cidadão.
- Bundle único cresce e afeta performance no portal cidadão (público vulnerável, dispositivos modestos).
- Rollback granular impossível.

### Alternativa D — Astro / Next.js para o portal cidadão + SPA para gestor

**Resumo**: Frameworks fullstack opinated para cada superfície.

**Por que rejeitada**:

- Duas stacks frontend distintas para uma equipe pequena = sobrecarga de manutenção.
- Reaproveitamento de componentes (`packages/ui`) fica complexo (Astro tem modelo distinto de hydration).
- Module Federation já entrega o benefício de isolamento sem duplicar stack.

## Referências

- [Spec de decomposição — Seção 2B (Onda 1 Frontend)](../superpowers/specs/2026-05-16-programa-mais-inclusao-decomposicao.md#seção-2b--onda-1-frontend)
- [Module Federation 2.0 docs](https://module-federation.io/)
- [Rspack docs](https://rspack.dev/)
- Zack Jackson, ["Why Module Federation"](https://module-federation.io/blog/why-module-federation) (criador do MF original).
