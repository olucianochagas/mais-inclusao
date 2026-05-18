import { describe, expect, it } from 'vitest';
import { zodToJsonSchema } from 'zod-to-json-schema';

import {
  LoginRequestSchema,
  LoginResponseSchema,
  MeResponseSchema,
  RefreshRequestSchema,
  RefreshResponseSchema,
} from '../../src/auth/http.js';

describe('LoginRequestSchema', () => {
  const valid = {
    email: 'user@example.com',
    password: 'super-secure-password-123',
    tenant_slug: 'sec-assistencia-sp',
  };

  it('aceita login válido', () => {
    expect(() => LoginRequestSchema.parse(valid)).not.toThrow();
  });

  it('rejeita email malformado', () => {
    expect(() => LoginRequestSchema.parse({ ...valid, email: 'not-email' })).toThrow();
  });

  it('rejeita email > 254 chars (RFC 5321)', () => {
    const longEmail = 'a'.repeat(250) + '@b.c';
    expect(() => LoginRequestSchema.parse({ ...valid, email: longEmail })).toThrow();
  });

  it('rejeita password < 12 chars', () => {
    expect(() => LoginRequestSchema.parse({ ...valid, password: 'short' })).toThrow();
  });

  it('rejeita password > 256 chars (defesa DoS)', () => {
    expect(() => LoginRequestSchema.parse({ ...valid, password: 'a'.repeat(257) })).toThrow();
  });

  it('aceita password com 12 chars exatos', () => {
    expect(() => LoginRequestSchema.parse({ ...valid, password: 'aaaaaaaaaaaa' })).not.toThrow();
  });

  it('rejeita tenant_slug vazio', () => {
    expect(() => LoginRequestSchema.parse({ ...valid, tenant_slug: '' })).toThrow();
  });

  it('rejeita tenant_slug > 64 chars', () => {
    expect(() => LoginRequestSchema.parse({ ...valid, tenant_slug: 'x'.repeat(65) })).toThrow();
  });
});

describe('LoginResponseSchema', () => {
  const valid = {
    access_token: 'eyJ-token-payload',
    refresh_token: 'eyJ-refresh-token',
    expires_in: 900,
    token_type: 'Bearer' as const,
  };

  it('aceita response válido', () => {
    expect(() => LoginResponseSchema.parse(valid)).not.toThrow();
  });

  it('rejeita token_type diferente de Bearer', () => {
    expect(() => LoginResponseSchema.parse({ ...valid, token_type: 'Basic' as never })).toThrow();
  });

  it('rejeita expires_in negativo', () => {
    expect(() => LoginResponseSchema.parse({ ...valid, expires_in: -1 })).toThrow();
  });

  it('rejeita expires_in não-inteiro', () => {
    expect(() => LoginResponseSchema.parse({ ...valid, expires_in: 100.5 })).toThrow();
  });
});

describe('RefreshRequestSchema', () => {
  it('aceita refresh válido', () => {
    expect(() => RefreshRequestSchema.parse({ refresh_token: 'token' })).not.toThrow();
  });

  it('rejeita sem refresh_token', () => {
    expect(() => RefreshRequestSchema.parse({})).toThrow();
  });
});

describe('RefreshResponseSchema', () => {
  it('é estruturalmente compatível com LoginResponseSchema', () => {
    const valid = {
      access_token: 'a',
      refresh_token: 'r',
      expires_in: 900,
      token_type: 'Bearer' as const,
    };
    expect(() => RefreshResponseSchema.parse(valid)).not.toThrow();
  });
});

describe('MeResponseSchema', () => {
  const valid = {
    user: {
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Maria da Silva',
      email: 'maria@secretaria.sp.gov.br',
    },
    tenant: {
      tenant_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      slug: 'sec-assistencia-sp',
      name: 'Secretaria de Assistência Social',
    },
    roles: ['gestor', 'triagem'],
  };

  it('aceita response válido', () => {
    expect(() => MeResponseSchema.parse(valid)).not.toThrow();
  });

  it('email é OBRIGATÓRIO em MeResponse (LGPD Art. 18 II)', () => {
    const userWithoutEmail = {
      name: valid.user.name,
      user_id: valid.user.user_id,
    };
    expect(() => MeResponseSchema.parse({ ...valid, user: userWithoutEmail })).toThrow();
  });

  it('aceita roles vazio (usuário sem permissão ainda)', () => {
    expect(() => MeResponseSchema.parse({ ...valid, roles: [] })).not.toThrow();
  });

  it('rejeita email malformado', () => {
    expect(() =>
      MeResponseSchema.parse({
        ...valid,
        user: { ...valid.user, email: 'not-email' },
      }),
    ).toThrow();
  });
});

describe('Auth HTTP JSON Schema snapshots', () => {
  it('LoginRequestSchema', () => {
    expect(zodToJsonSchema(LoginRequestSchema, { name: 'LoginRequest' })).toMatchSnapshot();
  });

  it('LoginResponseSchema', () => {
    expect(zodToJsonSchema(LoginResponseSchema, { name: 'LoginResponse' })).toMatchSnapshot();
  });

  it('RefreshRequestSchema', () => {
    expect(zodToJsonSchema(RefreshRequestSchema, { name: 'RefreshRequest' })).toMatchSnapshot();
  });

  it('RefreshResponseSchema', () => {
    expect(zodToJsonSchema(RefreshResponseSchema, { name: 'RefreshResponse' })).toMatchSnapshot();
  });

  it('MeResponseSchema', () => {
    expect(zodToJsonSchema(MeResponseSchema, { name: 'MeResponse' })).toMatchSnapshot();
  });
});
