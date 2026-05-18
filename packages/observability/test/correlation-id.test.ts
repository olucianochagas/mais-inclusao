import { describe, expect, it } from 'vitest';

import {
  CORRELATION_ID_HEADER,
  createCorrelationId,
  normalizeCorrelationId,
} from '../src/correlation-id.js';

describe('correlation id helpers', () => {
  it('exports the canonical correlation header', () => {
    expect(CORRELATION_ID_HEADER).toBe('x-correlation-id');
  });

  it('creates uuid v4 correlation ids', () => {
    const correlationId = createCorrelationId();

    expect(normalizeCorrelationId(correlationId)).toBe(correlationId);
  });

  it('rejects invalid ids', () => {
    expect(normalizeCorrelationId('not-a-uuid')).toBeUndefined();
    expect(normalizeCorrelationId(null)).toBeUndefined();
  });
});
