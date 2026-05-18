# ADR-0004: Mensageria NATS JetStream + Outbox Pattern

- **Status:** accepted
- **Data:** 2026-05-16
- **Decisores:** @olucianochagas
- **Tags:** backend, mensageria, integracao, fundacional

---

## Contexto

A arquitetura de microsserviços evolutivos (ver [ADR-0001](./0001-microsservicos-evolutivos-por-bounded-context.md)) exige um **mecanismo de comunicação inter-serviço** que:

- Garanta **consistência transacional** entre escrita no banco e publicação de evento, sem 2PC.
- Suporte **idempotência** end-to-end (publicador e consumidor).
- Permita **fan-out** (um evento, vários consumidores) sem acoplamento.
- Tenha **durabilidade** (mensagens não se perdem em queda de consumer).
- Seja **operacionalmente viável** para uma equipe pequena.
- Suporte **multi-tenancy** com `tenant_id` no header obrigatório.

Brokers avaliados:

|                        | Kafka                                       | RabbitMQ                           | Redis Streams             | **NATS JetStream**                    |
| ---------------------- | ------------------------------------------- | ---------------------------------- | ------------------------- | ------------------------------------- |
| Durabilidade           | Excelente                                   | Excelente                          | Boa (com config)          | Excelente                             |
| Throughput             | Muito alto                                  | Alto                               | Muito alto                | Alto                                  |
| Operação               | Pesada (ZK/KRaft, brokers, schema registry) | Média (cluster, queues, exchanges) | Leve                      | Leve                                  |
| Curva de aprendizado   | Alta                                        | Média                              | Baixa                     | Baixa                                 |
| Footprint dev (Docker) | Pesado (~1GB)                               | Médio (~300MB)                     | Pequeno (~100MB)          | Pequeno (~50MB)                       |
| Pattern matching       | Topics + partições                          | Exchanges + routing keys           | Streams + consumer groups | Subjects + wildcards                  |
| Dedup nativo           | Não (idempotent producer só pra retry)      | Não                                | Não                       | **Sim** (Msg-ID + janela)             |
| Maturidade 2026        | Maturíssimo                                 | Maturíssimo                        | Maturo                    | Maturo (JetStream estável desde 2021) |

A consistência entre commit no banco e publicação no broker é o **problema clássico do dual-write**. Soluções clássicas:

|                                | Vantagens                                           | Desvantagens                                                    |
| ------------------------------ | --------------------------------------------------- | --------------------------------------------------------------- |
| **Outbox Pattern**             | Consistência transacional sem 2PC, simples conceito | Worker extra por serviço; latência de poll                      |
| **CDC (Change Data Capture)**  | Sem código adicional na app                         | Infra adicional (Debezium etc.), schema do banco vira contrato  |
| **2PC (XA)**                   | Strong consistency                                  | Não disponível em todos brokers; performance ruim; complexidade |
| **Dual-write sem coordenação** | Sem complexidade                                    | Inconsistência silenciosa (anti-padrão)                         |

## Decisão

**Adotar NATS JetStream como event bus interno + Outbox Pattern por serviço.**

Concretamente:

1. **Broker**: NATS JetStream 2.10+ self-hosted no docker-compose dev. Mesmo broker em produção.
2. **Topic naming**: `mais-inclusao.<env>.events.<context>` (ex: `mais-inclusao.prod.events.applications`). Stream JetStream por context.
3. **Dedup**: cada mensagem publicada com `Msg-ID = outbox_event.id` (UUID). JetStream dedup window de 2 minutos.
4. **Outbox Pattern**:
   - Tabela `outbox_event` em cada serviço.
   - Transação única Prisma: insert entidade + insert outbox row.
   - Worker do mesmo serviço faz `SELECT FOR UPDATE SKIP LOCKED` em batch de 50.
   - Publica via NATS, marca como `dispatched`.
   - Backoff exponencial (1s → 5s → 30s → 5min → 30min); após `attempts > 6` → DLQ.
   - Cleanup: linhas `dispatched` > 7 dias são purgadas.
5. **Idempotência no consumer**: tabela `processed_events` com PK `event_id` no banco do consumer. Receber duas vezes = no-op silencioso.
6. **Envelope de evento obrigatório** (definido em `packages/contracts/src/shared/event-envelope.ts` — a ser criado no primeiro subprojeto da Onda 1):
   - Headers: `event_id`, `event_type`, `event_version` (SemVer), `occurred_at`, `tenant_id`, `correlation_id`, `causation_id`, `producer`.
   - Payload thin: apenas IDs e o que mudou.
7. **Validação dupla** (publicador valida antes do outbox; consumer valida antes de processar).
8. **`tenant_id` no header é invariante** — consumer rejeita evento sem ele (defesa cross-tenant).

## Consequências

### Positivas

- **Consistência transacional sem 2PC**: o outbox garante que entidade e evento são "comitados" juntos (ambos na mesma TX local).
- **Idempotência ponta-a-ponta**: dedup do JetStream (2min) + `processed_events` (7 dias) cobre republicações tardias do outbox.
- **Topic naming pattern do NATS** com wildcards (`mais-inclusao.prod.events.applications.*`) habilita observabilidade rica.
- **Footprint operacional baixo**: JetStream roda em container pequeno (~50MB), sem cluster ZooKeeper/KRaft. Sustentável para 1-3 devs.
- **Fan-out trivial**: novos consumers só precisam de subscription; não há reconfig do publicador.
- **Performance adequada**: latência típica < 5ms publish-to-ack; throughput suficiente para volume estimado.

### Negativas

- **Worker do outbox** adiciona complexidade operacional (precisa de monitoramento, dead letter queue, métrica de pending).
- **Latência adicional**: poll do worker (default 250ms) acumula sobre tempo do publish. Para latência ainda menor, alternativa é LISTEN/NOTIFY do Postgres (descartada na Onda 1 por simplicidade).
- **NATS é menos onipresente** que Kafka em produtos comerciais — engenheiros novos podem precisar de tempo para aprender. Mitigação: documentação interna + exemplos.
- **Operação em produção** requer config de retention, replicação (multi-region), backup do JetStream storage. Não trivial, mas mais simples que Kafka.

### Neutras

- **Schemas Zod** em `packages/contracts` viram fonte única de verdade para eventos. Versionamento via SemVer + Changesets — quebra de contrato = PR explícito.
- **Choice de Outbox** simplifica saga (ver Seção 4 da spec): saga coreografada via state-machine do agregado, sem orquestrador na Onda 1.

## Alternativas consideradas

### Alternativa A — Kafka (com Confluent Schema Registry)

**Resumo**: Apache Kafka como broker, Schema Registry para evolução de schemas.

**Por que rejeitada**:

- Overhead operacional desproporcional ao estado pre-alpha. Cluster Kafka + ZooKeeper (ou KRaft) + Schema Registry em dev local é pesado.
- Para o volume estimado da Onda 1, é overkill.
- Quando volume justificar (Ondas 2 ou 3), migração de NATS → Kafka é viável (eventos têm envelope estável; só muda o transporte).

### Alternativa B — RabbitMQ

**Resumo**: Broker AMQP maduro com exchanges + queues.

**Por que rejeitada**:

- Footprint maior em dev local.
- Sem dedup nativo (exige idempotência apenas na aplicação).
- Modelo de exchanges + routing keys é mais complexo que subjects do NATS para o caso simples de pub/sub deste projeto.

### Alternativa C — Redis Streams

**Resumo**: Recurso recente do Redis para event streaming.

**Por que rejeitada**:

- Durabilidade real depende de AOF/RDB config — não é safe-by-default como JetStream.
- Sem dedup nativo.
- Mistura cache + mensageria no mesmo serviço — uma queda do Redis derruba os dois.

### Alternativa D — CDC (Debezium ou pgoutput direto)

**Resumo**: Em vez de outbox manual, capturar mudanças do banco direto.

**Por que rejeitada**:

- Schema do banco vira contrato implícito — qualquer mudança de tabela pode quebrar consumers de forma sutil.
- Infra Debezium adicional (Kafka Connect ou similar) anula a leveza do NATS.
- Para a Onda 1, outbox manual é mais previsível e ensina o time o pattern.

### Alternativa E — gRPC sync entre serviços

**Resumo**: Comunicação síncrona com gRPC streams.

**Por que rejeitada**:

- Quebra a regra de "serviço de domínio não chama outro serviço de domínio" (ADR-0001).
- Cadeia síncrona vira fragilidade composta — uma queda derruba o caminho inteiro.
- Para o caso de uso (mudança de estado relevante para outros contextos), eventos async são naturalmente mais adequados.

## Referências

- [Spec de decomposição — Seção 4 (contratos, eventos, sagas, outbox)](../superpowers/specs/2026-05-16-programa-mais-inclusao-decomposicao.md#seção-4--contratos-eventos-sagas-e-outbox)
- [NATS JetStream docs](https://docs.nats.io/nats-concepts/jetstream)
- Chris Richardson, ["Pattern: Transactional Outbox"](https://microservices.io/patterns/data/transactional-outbox.html)
- Vaughn Vernon, _Implementing Domain-Driven Design_, 2013 (Saga e eventos).
