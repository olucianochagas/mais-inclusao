import { describe, expect, it } from 'vitest';
import { zodToJsonSchema } from 'zod-to-json-schema';

import {
  TenantCreatedEventSchema,
  type TenantCreatedPayload,
  TenantDeactivatedEventSchema,
  UserCreatedEventSchema,
  UserDeactivatedEventSchema,
} from '../../src/auth/events.js';

const headers = {
  event_id: '550e8400-e29b-41d4-a716-446655440000',
  event_type: 'auth.tenant.created',
  event_version: '1.0.0',
  occurred_at: '2026-05-17T10:30:00Z',
  tenant_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  correlation_id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  causation_id: null,
  producer: 'auth-service',
};

describe('TenantCreatedEventSchema', () => {
  const validPayload: TenantCreatedPayload = {
    tenant_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' as TenantCreatedPayload['tenant_id'],
    slug: 'sec-assistencia-sp',
    name: 'Secretaria de Assistência Social de São Paulo',
    plan: 'starter',
    created_at: '2026-05-17T10:30:00Z',
    created_by: 'admin@mais-inclusao',
  };

  it('aceita evento válido completo', () => {
    expect(() => TenantCreatedEventSchema.parse({ headers, payload: validPayload })).not.toThrow();
  });

  it('rejeita slug muito longo (> 64)', () => {
    expect(() =>
      TenantCreatedEventSchema.parse({
        headers,
        payload: { ...validPayload, slug: 'x'.repeat(65) },
      }),
    ).toThrow();
  });

  it('rejeita slug vazio', () => {
    expect(() =>
      TenantCreatedEventSchema.parse({
        headers,
        payload: { ...validPayload, slug: '' },
      }),
    ).toThrow();
  });

  it('rejeita plan inválido', () => {
    expect(() =>
      TenantCreatedEventSchema.parse({
        headers,
        payload: { ...validPayload, plan: 'platinum' as never },
      }),
    ).toThrow();
  });

  it('aceita todos os planos válidos', () => {
    const plans = ['free', 'starter', 'pro', 'enterprise'] as const;
    for (const plan of plans) {
      expect(() =>
        TenantCreatedEventSchema.parse({
          headers,
          payload: { ...validPayload, plan },
        }),
      ).not.toThrow();
    }
  });

  it('rejeita name vazio', () => {
    expect(() =>
      TenantCreatedEventSchema.parse({
        headers,
        payload: { ...validPayload, name: '' },
      }),
    ).toThrow();
  });

  it('rejeita name > 200 chars', () => {
    expect(() =>
      TenantCreatedEventSchema.parse({
        headers,
        payload: { ...validPayload, name: 'x'.repeat(201) },
      }),
    ).toThrow();
  });
});

describe('TenantDeactivatedEventSchema', () => {
  const validPayload = {
    tenant_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    deactivated_at: '2026-05-17T10:30:00Z',
    reason: 'contract_ended' as const,
  };

  it('aceita evento válido', () => {
    expect(() =>
      TenantDeactivatedEventSchema.parse({ headers, payload: validPayload }),
    ).not.toThrow();
  });

  it('aceita todos os reasons válidos', () => {
    const reasons = ['contract_ended', 'data_breach', 'unpaid', 'manual'] as const;
    for (const reason of reasons) {
      expect(() =>
        TenantDeactivatedEventSchema.parse({
          headers,
          payload: { ...validPayload, reason },
        }),
      ).not.toThrow();
    }
  });

  it('rejeita reason inválido', () => {
    expect(() =>
      TenantDeactivatedEventSchema.parse({
        headers,
        payload: { ...validPayload, reason: 'whatever' as never },
      }),
    ).toThrow();
  });
});

describe('UserCreatedEventSchema', () => {
  const validPayload = {
    user_id: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
    tenant_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    roles: ['gestor', 'triagem'],
    created_at: '2026-05-17T10:30:00Z',
  };

  it('aceita evento válido', () => {
    expect(() => UserCreatedEventSchema.parse({ headers, payload: validPayload })).not.toThrow();
  });

  it('rejeita roles vazias', () => {
    expect(() =>
      UserCreatedEventSchema.parse({
        headers,
        payload: { ...validPayload, roles: [] },
      }),
    ).toThrow();
  });

  it('aceita 1 role', () => {
    expect(() =>
      UserCreatedEventSchema.parse({
        headers,
        payload: { ...validPayload, roles: ['gestor'] },
      }),
    ).not.toThrow();
  });

  it('NÃO inclui email (PII protegida)', () => {
    const parsed = UserCreatedEventSchema.parse({
      headers,
      payload: validPayload,
    });
    expect('email' in parsed.payload).toBe(false);
  });
});

describe('UserDeactivatedEventSchema', () => {
  const validPayload = {
    user_id: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
    tenant_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    deactivated_at: '2026-05-17T10:30:00Z',
    reason: 'voluntary' as const,
  };

  it('aceita evento válido', () => {
    expect(() =>
      UserDeactivatedEventSchema.parse({ headers, payload: validPayload }),
    ).not.toThrow();
  });

  it('aceita todos os reasons', () => {
    const reasons = ['voluntary', 'role_revoked', 'security_incident', 'data_breach'] as const;
    for (const reason of reasons) {
      expect(() =>
        UserDeactivatedEventSchema.parse({
          headers,
          payload: { ...validPayload, reason },
        }),
      ).not.toThrow();
    }
  });
});

describe('Auth event JSON Schema snapshots', () => {
  it('TenantCreatedEventSchema', () => {
    expect(
      zodToJsonSchema(TenantCreatedEventSchema, { name: 'TenantCreatedEvent' }),
    ).toMatchSnapshot();
  });

  it('TenantDeactivatedEventSchema', () => {
    expect(
      zodToJsonSchema(TenantDeactivatedEventSchema, { name: 'TenantDeactivatedEvent' }),
    ).toMatchSnapshot();
  });

  it('UserCreatedEventSchema', () => {
    expect(zodToJsonSchema(UserCreatedEventSchema, { name: 'UserCreatedEvent' })).toMatchSnapshot();
  });

  it('UserDeactivatedEventSchema', () => {
    expect(
      zodToJsonSchema(UserDeactivatedEventSchema, { name: 'UserDeactivatedEvent' }),
    ).toMatchSnapshot();
  });
});
