# Architecture Decision Records (ADRs)

> ADRs capturam o **porquê histórico** de cada decisão arquitetural importante, num formato imutável. Quando uma decisão muda, criamos um **novo ADR** que substitui o anterior — o histórico não é apagado.

## Por que ADRs?

- **Memória institucional**: novos contribuidores conseguem entender *por que* o projeto está como está, sem precisar de oral history.
- **Reduz revisitas circulares**: alternativas já consideradas e rejeitadas estão documentadas — você não precisa redebater.
- **Auditável**: governança pública exige rastreabilidade de decisões. ADRs servem isso.
- **Imutável por design**: ADR aceito não é editado para "atualizar" — cria-se um novo que substitui.

## Formato

Usamos **MADR (Markdown Architecture Decision Records)**, leve e sem ferramenta:

```
# ADR-NNNN: Título da decisão (imperativo, curto)

- Status: proposed | accepted | deprecated | superseded by ADR-MMMM
- Data: YYYY-MM-DD
- Decisores: lista
- Tags: lista (opcional)

## Contexto

Que forças, restrições, problemas levaram a esta decisão?

## Decisão

Que opção foi escolhida?

## Consequências

Positivas, negativas, neutras. Tradeoffs explícitos.

## Alternativas consideradas

Cada alternativa rejeitada, com a razão da rejeição.

## Referências

Links para spec, RFC, issue, PR, leitura externa.
```

## Lifecycle

- **proposed** — em discussão; aguarda aceite.
- **accepted** — em vigor. Aplicável ao código atual.
- **deprecated** — não aplicar a código novo; código existente que ainda usa será migrado.
- **superseded by ADR-MMMM** — substituído. Aponta para o sucessor.

ADRs não são alterados após aceite (exceto correção de typo). Mudança = novo ADR.

## Numeração

Sequencial sem buracos. `0000` é o template. Próximos: `0001`, `0002`, ...

## Como propor um novo ADR

1. Copie `0000-template.md` → `NNNN-titulo-kebab-case.md` (próximo número disponível).
2. Preencha as seções.
3. Abra PR. Status inicial: `proposed`.
4. Discussão na PR. Decisão final do BDFL/comitê (ver [GOVERNANCE.md](../../GOVERNANCE.md)).
5. Ao aceitar, status muda para `accepted` no merge.

## Índice

| ADR | Status | Data | Título |
|---|---|---|---|
| [0000](./0000-template.md) | — | 2026-05-16 | Template |
| [0001](./0001-microsservicos-evolutivos-por-bounded-context.md) | accepted | 2026-05-16 | Adotar microsserviços evolutivos por bounded context |
| [0002](./0002-module-federation-rspack-frontend.md) | accepted | 2026-05-16 | Adotar Module Federation 2.0 + Rspack para frontends |
| [0003](./0003-monorepo-turborepo-pnpm.md) | accepted | 2026-05-16 | Monorepo Turborepo + pnpm 11.1.2 |
| [0004](./0004-nats-jetstream-outbox-pattern.md) | accepted | 2026-05-16 | Mensageria NATS JetStream + Outbox Pattern |
| [0005](./0005-multi-tenancy-defesa-em-profundidade.md) | accepted | 2026-05-16 | Multi-tenancy com 6 camadas de defesa em profundidade |
| [0006](./0006-criptografia-pii-em-coluna-kek-por-tenant.md) | accepted | 2026-05-16 | Criptografia de PII em coluna com KEK por tenant |
| [0007](./0007-wcag-22-aa-como-definition-of-done.md) | accepted | 2026-05-16 | WCAG 2.2 AA como Definition of Done |
| [0008](./0008-conventional-commits-dco-changesets.md) | accepted | 2026-05-16 | Conventional Commits + DCO + Changesets |
| [0009](./0009-bdfl-transitorio-como-modelo-de-governanca.md) | accepted | 2026-05-16 | BDFL transitório como modelo de governança inicial |
| [0010](./0010-dev-container-purista.md) | accepted | 2026-05-16 | Ambiente de desenvolvimento containerizado integralmente |

## Leituras recomendadas

- [Documenting Architecture Decisions — Michael Nygard (2011)](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [MADR — Markdown Architectural Decision Records](https://adr.github.io/madr/)
- [ADR GitHub Organization](https://adr.github.io/)
