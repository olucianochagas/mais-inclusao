import { type EventEnvelope, TenantIdSchema, UserIdSchema } from '@mais-inclusao/contracts/shared';
import { describe, expect, it } from 'vitest';

import { buildPublishCommand, createJetStreamPublisher } from '../src/nats.js';

const envelope = {
    headers: {
        event_id: '550e8400-e29b-41d4-a716-446655440000',
        event_type: 'auth.user.created',
        event_version: '1.0.0',
        occurred_at: '2026-05-17T10:30:00Z',
        tenant_id: TenantIdSchema.parse('6ba7b810-9dad-11d1-80b4-00c04fd430c8'),
        correlation_id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
        causation_id: null,
        producer: 'auth-service',
    },
    payload: {
        user_id: UserIdSchema.parse('6ba7b812-9dad-11d1-80b4-00c04fd430c8'),
        tenant_id: TenantIdSchema.parse('6ba7b810-9dad-11d1-80b4-00c04fd430c8'),
        roles: ['gestor'],
        created_at: '2026-05-17T10:30:00Z',
    },
} satisfies EventEnvelope<{
    user_id: string;
    tenant_id: string;
    roles: string[];
    created_at: string;
}>;

describe('NATS publisher helpers', () => {
    it('builds a publish command with Msg-ID', () => {
        const command = buildPublishCommand(envelope, 'dev');

        expect(command.subject).toBe('mais-inclusao.dev.events.auth');
        expect(command.msgId).toBe(envelope.headers.event_id);
        expect(new TextDecoder().decode(command.payload)).toContain('auth.user.created');
    });

    it('publishes via transport and returns ack plus command', async () => {
        const transport = {
            publish: () =>
                Promise.resolve({
                    seq: 7,
                    stream: 'events',
                    duplicate: false,
                    domain: '',
                    ack: true,
                }),
        };

        const publisher = createJetStreamPublisher(transport, { environment: 'dev' });
        const result = await publisher.publishEnvelope(envelope);

        expect(result.command.subject).toBe('mais-inclusao.dev.events.auth');
        expect(result.command.msgId).toBe(envelope.headers.event_id);
        expect(result.ack.seq).toBe(7);
    });
});
