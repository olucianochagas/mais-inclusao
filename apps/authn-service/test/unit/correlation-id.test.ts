import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { getCorrelationId, runWithCorrelationId } from '../../src/context/correlation-id.context.js';
import { CorrelationIdInterceptor } from '../../src/context/correlation-id.interceptor.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const mockCtx = (headers: Record<string, string>): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  }) as unknown as ExecutionContext;

describe('correlation-id ALS', () => {
  it('isola correlation_id por chamada de runWithCorrelationId', () => {
    let outer: string | undefined;
    let inner: string | undefined;
    runWithCorrelationId('outer-id', () => {
      outer = getCorrelationId();
      runWithCorrelationId('inner-id', () => {
        inner = getCorrelationId();
      });
    });
    expect(outer).toBe('outer-id');
    expect(inner).toBe('inner-id');
    expect(getCorrelationId()).toBeUndefined();
  });
});

describe('CorrelationIdInterceptor', () => {
  const interceptor = new CorrelationIdInterceptor();

  it('usa correlation_id válido do header x-correlation-id', async () => {
    const valid = '550e8400-e29b-41d4-a716-446655440000';
    const ctx = mockCtx({ 'x-correlation-id': valid });
    const next: CallHandler = { handle: () => of(getCorrelationId() ?? 'NONE') };
    await expect(firstValueFrom(interceptor.intercept(ctx, next))).resolves.toBe(valid);
  });

  it('gera UUID novo quando header ausente', async () => {
    const ctx = mockCtx({});
    let captured: string | undefined;
    const next: CallHandler = {
      handle: () => {
        captured = getCorrelationId();
        return of(null);
      },
    };
    await firstValueFrom(interceptor.intercept(ctx, next));
    expect(captured).toMatch(UUID_PATTERN);
  });

  it('rejeita correlation_id mal formado e gera novo UUID', async () => {
    const ctx = mockCtx({ 'x-correlation-id': 'not-a-uuid' });
    let captured: string | undefined;
    const next: CallHandler = {
      handle: () => {
        captured = getCorrelationId();
        return of(null);
      },
    };
    await firstValueFrom(interceptor.intercept(ctx, next));
    expect(captured).toMatch(UUID_PATTERN);
    expect(captured).not.toBe('not-a-uuid');
  });
});
