import type { EventEnvelope } from '@mais-inclusao/contracts/shared';
import { connect, type NatsConnection, type PubAck, StringCodec } from 'nats';

import { buildEventSubject, normalizeEnvironment } from './subject.js';

export interface PublishCommand {
  subject: string;
  payload: Uint8Array;
  msgId: string;
}

export interface JetStreamTransport {
  publish(subject: string, payload: Uint8Array, options: { msgID: string }): Promise<PubAck>;
}

export interface EventPublisher {
  publishEnvelope<TPayload>(
    envelope: EventEnvelope<TPayload>,
  ): Promise<{ ack: PubAck; command: PublishCommand }>;
}

export interface CreatePublisherOptions {
  environment?: string;
}

export function connectMessagingNats(url = 'nats://127.0.0.1:4222'): Promise<NatsConnection> {
  return connect({ servers: url });
}

export function buildPublishCommand<TPayload>(
  envelope: EventEnvelope<TPayload>,
  environment: string,
): PublishCommand {
  const codec = StringCodec();
  const subject = buildEventSubject(environment, envelope.headers.event_type);

  return {
    subject,
    payload: codec.encode(JSON.stringify(envelope)),
    msgId: envelope.headers.event_id,
  } satisfies PublishCommand;
}

export function createJetStreamPublisher(
  transport: JetStreamTransport,
  options: CreatePublisherOptions = {},
): EventPublisher {
  const environment = normalizeEnvironment(options.environment ?? 'dev');

  return {
    async publishEnvelope<TPayload>(envelope: EventEnvelope<TPayload>) {
      const command = buildPublishCommand(envelope, environment);
      const ack = await transport.publish(command.subject, command.payload, {
        msgID: command.msgId,
      });

      return { ack, command };
    },
  };
}

export function createJetStreamPublisherFromConnection(
  connection: Pick<NatsConnection, 'jetstream'>,
  options: CreatePublisherOptions = {},
): EventPublisher {
  return createJetStreamPublisher(connection.jetstream(), options);
}
