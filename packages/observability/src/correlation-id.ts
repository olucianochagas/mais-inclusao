import { randomUUID } from 'node:crypto';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const CORRELATION_ID_HEADER = 'x-correlation-id';

export const createCorrelationId = (): string => randomUUID();

export const normalizeCorrelationId = (
  value: string | null | undefined,
): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalizedValue = value.trim();

  if (!UUID_V4_PATTERN.test(normalizedValue)) {
    return undefined;
  }

  return normalizedValue;
};
