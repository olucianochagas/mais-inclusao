import { describe, expect, it } from 'vitest';

import { DEFAULT_BACKOFF_MS, getBackoffDelayMs } from '../src/backoff.js';

describe('backoff helpers', () => {
  it('returns zero for non-positive attempt numbers', () => {
    expect(getBackoffDelayMs(0)).toBe(0);
    expect(getBackoffDelayMs(-1)).toBe(0);
  });

  it('returns the first backoff for attempt 1', () => {
    expect(getBackoffDelayMs(1)).toBe(DEFAULT_BACKOFF_MS[0]);
  });

  it('clamps to the last entry of the schedule', () => {
    expect(getBackoffDelayMs(99)).toBe(getBackoffDelayMs(DEFAULT_BACKOFF_MS.length));
  });

  it('supports custom schedules', () => {
    expect(getBackoffDelayMs(2, [100, 200, 300])).toBe(200);
  });
});
