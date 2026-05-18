import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import {
  type EventEnvelope,
  EventEnvelopeSchema,
  type EventHeaders,
  EventHeadersSchema,
} from '../../src/shared/event-envelope.js';

const validHeaders = {
  event_id: '550e8400-e29b-41d4-a716-446655440000',
  event_type: 'auth.tenant.created',
  event_version: '1.0.0',
  occurred_at: '2026-05-17T10:30:00Z',
  tenant_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  correlation_id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  causation_id: null,
  producer: 'auth-service',
};

describe('EventHeadersSchema', () => {
  it('aceita headers válidos completos', () => {
    expect(() => EventHeadersSchema.parse(validHeaders)).not.toThrow();
  });

  describe('event_id', () => {
    it('rejeita não-UUID', () => {
      expect(() => EventHeadersSchema.parse({ ...validHeaders, event_id: 'not-uuid' })).toThrow();
    });
  });

  describe('event_type', () => {
    it('aceita pattern <context>.<entity>.<event>', () => {
      const valid = ['auth.tenant.created', 'programs.program.published'];
      for (const t of valid) {
        expect(() => EventHeadersSchema.parse({ ...validHeaders, event_type: t })).not.toThrow();
      }
    });

    it('rejeita pattern com PascalCase', () => {
      expect(() =>
        EventHeadersSchema.parse({
          ...validHeaders,
          event_type: 'Auth.Tenant.Created',
        }),
      ).toThrow();
    });

    it('rejeita pattern com menos de 3 partes', () => {
      expect(() =>
        EventHeadersSchema.parse({
          ...validHeaders,
          event_type: 'auth.created',
        }),
      ).toThrow();
    });

    it('rejeita pattern com hífen', () => {
      expect(() =>
        EventHeadersSchema.parse({
          ...validHeaders,
          event_type: 'auth.user-created.event',
        }),
      ).toThrow();
    });
  });

  describe('event_version', () => {
    it('aceita SemVer válido', () => {
      const valid = ['0.1.0', '1.0.0', '10.20.30'];
      for (const v of valid) {
        expect(() => EventHeadersSchema.parse({ ...validHeaders, event_version: v })).not.toThrow();
      }
    });

    it('rejeita SemVer parcial', () => {
      expect(() => EventHeadersSchema.parse({ ...validHeaders, event_version: '1.0' })).toThrow();
    });

    it('rejeita prerelease', () => {
      expect(() =>
        EventHeadersSchema.parse({
          ...validHeaders,
          event_version: '1.0.0-alpha',
        }),
      ).toThrow();
    });
  });

  describe('tenant_id (INVARIANTE)', () => {
    it('rejeita ausência (defesa cross-tenant)', () => {
      const withoutTenant = {
        causation_id: validHeaders.causation_id,
        correlation_id: validHeaders.correlation_id,
        event_id: validHeaders.event_id,
        event_type: validHeaders.event_type,
        event_version: validHeaders.event_version,
        occurred_at: validHeaders.occurred_at,
        producer: validHeaders.producer,
      };
      expect(() => EventHeadersSchema.parse(withoutTenant)).toThrow();
    });

    it('rejeita string vazia', () => {
      expect(() => EventHeadersSchema.parse({ ...validHeaders, tenant_id: '' })).toThrow();
    });
  });

  describe('occurred_at', () => {
    it('aceita ISO 8601 com offset UTC', () => {
      expect(() =>
        EventHeadersSchema.parse({
          ...validHeaders,
          occurred_at: '2026-05-17T10:30:00Z',
        }),
      ).not.toThrow();
    });

    it('aceita ISO 8601 com offset numérico', () => {
      expect(() =>
        EventHeadersSchema.parse({
          ...validHeaders,
          occurred_at: '2026-05-17T10:30:00-03:00',
        }),
      ).not.toThrow();
    });

    it('rejeita data sem offset', () => {
      expect(() =>
        EventHeadersSchema.parse({
          ...validHeaders,
          occurred_at: '2026-05-17T10:30:00',
        }),
      ).toThrow();
    });
  });

  describe('causation_id', () => {
    it('aceita null (eventos raiz)', () => {
      expect(() => EventHeadersSchema.parse({ ...validHeaders, causation_id: null })).not.toThrow();
    });

    it('aceita ausência (default null)', () => {
      const withoutCausation = {
        correlation_id: validHeaders.correlation_id,
        event_id: validHeaders.event_id,
        event_type: validHeaders.event_type,
        event_version: validHeaders.event_version,
        occurred_at: validHeaders.occurred_at,
        producer: validHeaders.producer,
        tenant_id: validHeaders.tenant_id,
      };
      const parsed = EventHeadersSchema.parse(withoutCausation);
      expect(parsed.causation_id).toBeNull();
    });

    it('aceita UUID', () => {
      expect(() =>
        EventHeadersSchema.parse({
          ...validHeaders,
          causation_id: '550e8400-e29b-41d4-a716-446655440099',
        }),
      ).not.toThrow();
    });
  });

  describe('producer', () => {
    it('rejeita string vazia', () => {
      expect(() => EventHeadersSchema.parse({ ...validHeaders, producer: '' })).toThrow();
    });
  });

  it('infere EventHeaders corretamente', () => {
    const parsed = EventHeadersSchema.parse(validHeaders);
    expectTypeOf(parsed).toExtend<EventHeaders>();
  });
});

describe('EventEnvelopeSchema', () => {
  const PayloadSchema = z.object({ foo: z.string(), bar: z.number() });

  it('compõe envelope tipado com payload', () => {
    const Envelope = EventEnvelopeSchema(PayloadSchema);
    const valid = { headers: validHeaders, payload: { foo: 'hello', bar: 42 } };
    expect(() => Envelope.parse(valid)).not.toThrow();
  });

  it('rejeita envelope com payload errado', () => {
    const Envelope = EventEnvelopeSchema(PayloadSchema);
    const invalid = {
      headers: validHeaders,
      payload: { foo: 'hello', bar: 'not-number' },
    };
    expect(() => Envelope.parse(invalid)).toThrow();
  });

  it('rejeita envelope sem headers', () => {
    const Envelope = EventEnvelopeSchema(PayloadSchema);
    expect(() => Envelope.parse({ payload: { foo: 'hi', bar: 1 } })).toThrow();
  });

  it('tipo EventEnvelope<T> reflete payload', () => {
    type X = EventEnvelope<{ foo: string }>;
    expectTypeOf<X['headers']>().toExtend<EventHeaders>();
    expectTypeOf<X['payload']>().toEqualTypeOf<{ foo: string }>();
  });
});

describe('Event schemas JSON Schema snapshots', () => {
  it('EventHeadersSchema', () => {
    expect(zodToJsonSchema(EventHeadersSchema, { name: 'EventHeaders' })).toMatchSnapshot();
  });

  it('EventEnvelopeSchema', () => {
    const EnvelopeSchema = EventEnvelopeSchema(z.object({ foo: z.string(), bar: z.number() }));
    expect(zodToJsonSchema(EnvelopeSchema, { name: 'EventEnvelope' })).toMatchSnapshot();
  });
});
