# ADR-0001: Adotar microsserviços evolutivos por bounded context

- **Status:** accepted
- **Data:** 2026-05-16
- **Decisores:** @olucianochagas
- **Tags:** arquitetura, ddd, microservices, fundacional

---

## Contexto

O +Inclusão é uma plataforma SaaS multi-tenant para governança pública de inclusão social. O escopo identificado no brainstorming inicial cobre **22 bounded contexts** distintos — desde catálogo de programas e ciclo de inscrição até billing, BI, ETL, autenticação cidadã e auditoria especializada.

Considerando que:

- O produto está em **pre-alpha** (zero usuários reais ainda).
- A equipe inicial é **pequena** (1 mantenedor evoluindo para comunidade).
- A spec do projeto fixou **microsserviços NestJS** + **micro frontends Module Federation** como direção arquitetural.
- O domínio é vasto e ainda **incompletamente compreendido** — definir fronteiras finais agora seria especulação.
- A LGPD impõe **isolamento estrito** entre tenants e dados sensíveis (Art. 11), o que reforça benefício de boas fronteiras.

A pergunta concreta: **quantos microsserviços criar do dia zero, e como mapeá-los aos bounded contexts?**

Três caminhos foram avaliados (Seção "Decisão de abordagem" da spec):

|                      | A — Big-bang                                  | B — Evolutivos                  | C — Capability-based           |
| -------------------- | --------------------------------------------- | ------------------------------- | ------------------------------ |
| Granularidade        | 15-20 serviços do dia 0                       | 4 serviços + 2 BFFs na Onda 1   | 1 monolito + serviços técnicos |
| Velocidade MVP       | Baixa                                         | Média-alta                      | Alta                           |
| Overhead operacional | Brutal                                        | Sustentável                     | Baixo-médio                    |
| Risco                | Fronteiras erradas viram refactor distribuído | Disciplina exigida em contratos | Monolito de domínio cresce     |

## Decisão

**Adotar microsserviços evolutivos por bounded context (Abordagem B).**

Concretamente:

1. **Onda 1 (MVP)** entrega 4 microsserviços de domínio + 2 BFFs + 1 capability transversal (Audit como Nest Interceptor, não-serviço):
   - `auth-service` (Identity + Tenancy fundidos)
   - `programs-service` (Programs + Eligibility embutido)
   - `citizens-service` (Citizens light)
   - `applications-service` (Inscrição + Triagem + Concessão num só serviço)
   - `bff-gestor`, `bff-cidadao`
2. **Fronteiras são extraídas por evidência**, não por especulação. Cada extração requer **pelo menos um gatilho concreto** (escala, time, regulação, domínio, release cadence, teste — ver Seção 6 da spec).
3. **Contratos públicos versionados desde o dia 0** em `packages/contracts`. Mesmo dentro de um único deploy, módulos se falam por contrato versionado (SemVer + Changesets).
4. **Comunicação inter-serviço apenas via eventos** (NATS) para mudança de estado; HTTP só no caminho BFF → serviço e serviço → auth-service.
5. **Multi-tenancy é invariante de toda query** (ver [ADR-0005](./0005-multi-tenancy-defesa-em-profundidade.md)).

## Consequências

### Positivas

- **MVP entrega valor de ponta a ponta** (cadastrar programa → inscrição → triagem → concessão) com 5 unidades de deploy, não 15-20. Operacionalmente sustentável para 1-3 devs.
- **Honra a aposta** arquitetural original (microsserviços + MF + Turborepo) com cadência realista.
- **Fronteiras corretas** emergem da prática, não da especulação. Quando `Eligibility` ficar complexo o suficiente, será extraído de `programs-service` com sinais claros.
- **Resistência à mudança**: contratos públicos versionados desde o dia 0 evitam que a fusão temporária (ex: Inscrição+Triagem+Concessão num só serviço) prenda os consumers — quando extrair, é mecânico.
- **Suporta crescimento da equipe**: novas pessoas podem assumir extrações como ciclos de spec→plano→implementação próprios.

### Negativas

- **Disciplina exigida**: o mantenedor precisa resistir à tentação de criar atalhos entre módulos do mesmo serviço (chamadas diretas em vez de eventos, leitura cross-context sem contrato). Sem essa disciplina, vira monolito disfarçado.
- **Refactor futuro real**: quando extrair `Triage` ou `Grant` de `applications-service`, há migração de dados e topologia. Não é gratuito.
- **Curva de aprendizado**: contribuidores precisam entender DDD, bounded contexts, eventos, outbox — antes de qualquer feature. Documentação compensa, mas não elimina.
- **Métricas de gatilho de extração precisam existir**: sem observabilidade adequada (p99 por módulo, contagem de PRs, etc.), os critérios de extração viram subjetivos.

### Neutras

- Pacotes compartilhados (`packages/contracts`, `packages/persistence`, `packages/messaging`, `packages/audit`) ficam no caminho crítico de quase tudo. Mudanças neles afetam todos os serviços — exigem rigor de revisão (CODEOWNERS, Changesets) mas centralizam padrões.

## Alternativas consideradas

### Alternativa A — Big-bang microservices

**Resumo**: 15-20 microsserviços do dia zero, um por bounded context identificado.

**Por que rejeitada**:

- Overhead operacional desproporcional ao estado pre-alpha (15+ pipelines, schemas, deploys, observabilidade).
- Fronteiras adivinhadas erram com frequência. Refactor distribuído é várias vezes mais caro que refactor em monorepo.
- Velocidade inicial baixa: meses só de plumbing antes de qualquer feature de produto.
- Não há equipe para sustentar.

### Alternativa C — Capability-based

**Resumo**: 1 monolito de domínio + serviços técnicos ao redor (Identity, Notify, Files, Search, Audit, ...).

**Por que rejeitada**:

- Atrito direto com a aposta de microsserviços do enunciado.
- O monolito de domínio cresceria rapidamente — em SaaS multi-tenant com regras por tenant, vira hotspot e bottleneck.
- Perde-se granularidade DDD: indicadores, triagem e concessão dividem deploy e operacionalmente acoplam-se.

### Alternativa D — Monolito modular puro

**Resumo**: 1 único deploy NestJS bem modularizado, sem microsserviços, com migração futura quando necessário.

**Por que rejeitada**:

- Conflita com requisito explícito do projeto (microsserviços).
- Tenants enterprise tipicamente exigem isolamento de superfície que monolito não entrega.
- A história mostra que monolito modular "para depois extrair" raramente é extraído sem refactor doloroso.

## Referências

- [Spec de decomposição — Seção "Decisão de abordagem"](../superpowers/specs/2026-05-16-programa-mais-inclusao-decomposicao.md#decisão-de-abordagem)
- [Spec — Seção 6 (gatilhos de extração)](../superpowers/specs/2026-05-16-programa-mais-inclusao-decomposicao.md#seção-6--ondas-seguintes-e-gatilhos-de-extração)
- Eric Evans, _Domain-Driven Design: Tackling Complexity in the Heart of Software_, 2003.
- Sam Newman, _Building Microservices_, 2nd ed., 2021.
- Martin Fowler, ["Microservice Trade-Offs"](https://martinfowler.com/articles/microservice-trade-offs.html) (2015).
