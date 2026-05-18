import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { PaginatedResultSchema, PaginationQuerySchema } from '../../src/shared/pagination.js';

describe('PaginationQuerySchema', () => {
  it('aceita query vazia (usa defaults)', () => {
    const parsed = PaginationQuerySchema.parse({});
    expect(parsed.limit).toBe(20);
    expect(parsed.cursor).toBeUndefined();
  });

  it('aceita limit válido', () => {
    expect(PaginationQuerySchema.parse({ limit: 50 }).limit).toBe(50);
  });

  it('coage string numérica (query string)', () => {
    expect(PaginationQuerySchema.parse({ limit: '25' }).limit).toBe(25);
  });

  it('rejeita limit = 0', () => {
    expect(() => PaginationQuerySchema.parse({ limit: 0 })).toThrow();
  });

  it('rejeita limit negativo', () => {
    expect(() => PaginationQuerySchema.parse({ limit: -1 })).toThrow();
  });

  it('rejeita limit > 100 (defesa DoS)', () => {
    expect(() => PaginationQuerySchema.parse({ limit: 101 })).toThrow();
    expect(() => PaginationQuerySchema.parse({ limit: 1000 })).toThrow();
  });

  it('rejeita limit não-inteiro', () => {
    expect(() => PaginationQuerySchema.parse({ limit: 1.5 })).toThrow();
  });

  it('aceita cursor opaco', () => {
    expect(PaginationQuerySchema.parse({ cursor: 'abc123==' }).cursor).toBe('abc123==');
  });
});

describe('PaginatedResultSchema', () => {
  const ItemSchema = z.object({ id: z.string(), name: z.string() });
  const ResultSchema = PaginatedResultSchema(ItemSchema);

  it('aceita result válido com next_cursor', () => {
    const data = {
      items: [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
      ],
      next_cursor: 'abc',
    };
    expect(() => ResultSchema.parse(data)).not.toThrow();
  });

  it('aceita result vazio com next_cursor null', () => {
    expect(() => ResultSchema.parse({ items: [], next_cursor: null })).not.toThrow();
  });

  it('aceita total_estimate opcional', () => {
    expect(() =>
      ResultSchema.parse({
        items: [],
        next_cursor: null,
        total_estimate: 42,
      }),
    ).not.toThrow();
  });

  it('rejeita total_estimate negativo', () => {
    expect(() =>
      ResultSchema.parse({
        items: [],
        next_cursor: null,
        total_estimate: -1,
      }),
    ).toThrow();
  });

  it('rejeita item que não casa com schema', () => {
    expect(() =>
      ResultSchema.parse({
        items: [{ id: 1, name: 'wrong-type' }],
        next_cursor: null,
      }),
    ).toThrow();
  });
});

describe('Pagination schemas JSON Schema snapshots', () => {
  it('PaginationQuerySchema', () => {
    expect(zodToJsonSchema(PaginationQuerySchema, { name: 'PaginationQuery' })).toMatchSnapshot();
  });

  it('PaginatedResultSchema', () => {
    const ItemSchema = z.object({ id: z.string(), name: z.string() });
    const ResultSchema = PaginatedResultSchema(ItemSchema);
    expect(zodToJsonSchema(ResultSchema, { name: 'PaginatedResult' })).toMatchSnapshot();
  });
});
