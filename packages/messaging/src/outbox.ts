import type { EventEnvelope } from '@mais-inclusao/contracts/shared';

import { getBackoffDelayMs } from './backoff.js';
import type { EventPublisher } from './nats.js';

export interface OutboxRecord<TPayload> extends EventEnvelope<TPayload> {
    id: string;
    attempts: number;
}

export interface OutboxStore<TPayload> {
    claimBatch(limit: number): Promise<OutboxRecord<TPayload>[]>;
    markDispatched(
        id: string,
        data: { dispatchedAt: Date; ackId: string; },
    ): Promise<void>;
    markFailed(
        id: string,
        data: { attempts: number; nextAttemptAt: Date; reason: string; },
    ): Promise<void>;
}

export interface OutboxDispatcherOptions {
    batchSize?: number;
    environment?: string;
    backoffScheduleMs?: readonly number[];
    clock?: () => Date;
    logger?: Pick<Console, 'info' | 'warn' | 'error'>;
}

export interface DispatchSummary {
    claimed: number;
    dispatched: number;
    failed: number;
}

export async function dispatchOutboxBatch<TPayload>(
    store: OutboxStore<TPayload>,
    publisher: EventPublisher,
    options: OutboxDispatcherOptions = {},
): Promise<DispatchSummary> {
    const batchSize = options.batchSize ?? 50;
    const clock = options.clock ?? (() => new Date());
    const backoffScheduleMs = options.backoffScheduleMs;
    const logger = options.logger;

    const claimed = await store.claimBatch(batchSize);
    let dispatched = 0;
    let failed = 0;

    for (const record of claimed) {
        try {
            const { ack } = await publisher.publishEnvelope(record);
            await store.markDispatched(record.id, {
                dispatchedAt: clock(),
                ackId: ack.seq.toString(),
            });
            dispatched += 1;
        } catch (error) {
            const nextAttemptAt = new Date(
                clock().getTime() + getBackoffDelayMs(record.attempts + 1, backoffScheduleMs),
            );
            const reason = error instanceof Error ? error.message : 'Unknown error';

            await store.markFailed(record.id, {
                attempts: record.attempts + 1,
                nextAttemptAt,
                reason,
            });

            logger?.warn(`Outbox dispatch failed for ${record.id}: ${reason}`);
            failed += 1;
        }
    }

    logger?.info(
        'Outbox batch processed: claimed=' +
        claimed.length.toString() +
        ' dispatched=' +
        dispatched.toString() +
        ' failed=' +
        failed.toString(),
    );

    return {
        claimed: claimed.length,
        dispatched,
        failed,
    };
}
