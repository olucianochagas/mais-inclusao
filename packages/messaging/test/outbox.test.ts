import { TenantIdSchema, UserIdSchema } from '@mais-inclusao/contracts/shared';
import { describe, expect, it, vi } from 'vitest';

import type { OutboxRecord } from '../src/outbox.js';
import { dispatchOutboxBatch } from '../src/outbox.js';

const record = {
    id: 'outbox-1',
    attempts: 0,
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
} satisfies OutboxRecord<{
    user_id: string;
    tenant_id: string;
    roles: string[];
    created_at: string;
}>;

describe('dispatchOutboxBatch', () => {
    it('publishes and marks records as dispatched', async () => {
        const store = {
            claimBatch: vi.fn(() => Promise.resolve([record])),
            markDispatched: vi.fn(() => Promise.resolve(undefined)),
            markFailed: vi.fn(() => Promise.resolve(undefined)),
        };

        const publisher = {
            publishEnvelope: vi.fn(() =>
                Promise.resolve({
                    ack: { seq: 42, stream: 'events', duplicate: false, domain: '', ack: true },
                    command: {
                        subject: 'mais-inclusao.dev.events.auth',
                        payload: new Uint8Array(),
                        msgId: record.headers.event_id,
                    },
                }),
            ),
        };

        const summary = await dispatchOutboxBatch(store, publisher, {
            clock: () => new Date('2026-05-17T10:30:00Z'),
            logger: console,
        });

        expect(summary).toEqual({ claimed: 1, dispatched: 1, failed: 0 });
        expect(store.markDispatched).toHaveBeenCalledTimes(1);
        expect(store.markFailed).not.toHaveBeenCalled();
    });

    it('marks failures with backoff', async () => {
        let failure:
            | {
                attempts: number;
                reason: string;
            }
            | undefined;

        const store = {
            claimBatch: vi.fn(() => Promise.resolve([record])),
            markDispatched: vi.fn(() => Promise.resolve(undefined)),
            markFailed: vi.fn((_, nextFailure: { attempts: number; reason: string; }) => {
                failure = nextFailure;

                return Promise.resolve(undefined);
            }),
        };

        const publisher = {
            publishEnvelope: vi.fn(() => Promise.reject(new Error('boom'))),
        };

        const summary = await dispatchOutboxBatch(store, publisher, {
            clock: () => new Date('2026-05-17T10:30:00Z'),
            backoffScheduleMs: [1000, 2000],
        });

        expect(summary).toEqual({ claimed: 1, dispatched: 0, failed: 1 });
        expect(store.markFailed).toHaveBeenCalledTimes(1);
        expect(failure).toBeDefined();
        expect(failure?.attempts).toBe(1);
        expect(failure?.reason).toBe('boom');
    });
});
