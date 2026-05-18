# @mais-inclusao/messaging

Helpers de NATS JetStream e Outbox para o monorepo **+Inclusão**. Este package padroniza como serviços publicam eventos, montam subjects e coordenam a publicação do outbox com deduplicação via `event_id`.

## O que ele cobre

- Conexão com NATS JetStream.
- Subject naming padronizado: `mais-inclusao.<env>.events.<context>`.
- Publicação de envelopes de evento com `Msg-ID` derivado de `headers.event_id`.
- Dispatcher de Outbox com batch, retry e backoff.

## Uso rápido

```ts
import {
  connectMessagingNats,
  createJetStreamPublisher,
} from '@mais-inclusao/messaging';

const nc = await connectMessagingNats();
const publisher = createJetStreamPublisher(nc.jetstream(), {
  environment: 'dev',
});
```

## Padrão de subject

- Namespace fixo: `mais-inclusao`
- Ambiente: `dev`, `staging`, `prod`, etc.
- Canal: `events`
- Contexto: primeiro segmento de `event_type` (ex.: `auth.user.created` → `auth`)

Exemplo final:

- `auth.user.created` em `dev` → `mais-inclusao.dev.events.auth`

## Outbox

O dispatcher espera registros no formato de envelope e usa:

- `headers.event_id` como `Msg-ID`
- `headers.event_type` para derivar o subject
- `attempts` + backoff configurável para reprocessamento

## Variáveis de ambiente

- `NATS_URL` — endpoint do cluster local/produção.
- `NATS_ENV` — ambiente lógico usado no subject.

## Observação

Este package é a fundação técnica; a integração com Prisma/outbox table virá nos serviços consumidores e no próximo pacote de persistência.
