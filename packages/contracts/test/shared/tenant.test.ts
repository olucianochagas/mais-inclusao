import { describe, expect, expectTypeOf, it } from 'vitest';
import { zodToJsonSchema } from 'zod-to-json-schema';

import {
  type TenantClaim,
  TenantClaimSchema,
  type TenantId,
  TenantIdSchema,
} from '../../src/shared/tenant.js';

describe('TenantIdSchema', () => {
  it('aceita UUID v4 válido', () => {
    const valid = '550e8400-e29b-41d4-a716-446655440000';
    expect(() => TenantIdSchema.parse(valid)).not.toThrow();
  });

  it('rejeita string vazia', () => {
    expect(() => TenantIdSchema.parse('')).toThrow();
  });

  it('rejeita UUID malformado', () => {
    expect(() => TenantIdSchema.parse('not-a-uuid')).toThrow();
  });

  it('rejeita número', () => {
    expect(() => TenantIdSchema.parse(42)).toThrow();
  });

  it('preserva o brand TenantId no tipo inferido', () => {
    expectTypeOf<TenantId>().toExtend<string>();
    const id = TenantIdSchema.parse('550e8400-e29b-41d4-a716-446655440000');
    expectTypeOf(id).toEqualTypeOf<TenantId>();
  });
});

describe('TenantClaimSchema', () => {
  const validClaim = {
    tenant_id: '550e8400-e29b-41d4-a716-446655440000',
    user_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    roles: ['admin', 'editor'],
  };

  it('aceita claim válido completo', () => {
    expect(() => TenantClaimSchema.parse(validClaim)).not.toThrow();
  });

  it('rejeita claim sem tenant_id', () => {
    const withoutTenant = {
      roles: validClaim.roles,
      user_id: validClaim.user_id,
    };
    expect(() => TenantClaimSchema.parse(withoutTenant)).toThrow();
  });

  it('rejeita claim sem user_id', () => {
    const withoutUser = {
      roles: validClaim.roles,
      tenant_id: validClaim.tenant_id,
    };
    expect(() => TenantClaimSchema.parse(withoutUser)).toThrow();
  });

  it('rejeita roles não-array', () => {
    expect(() => TenantClaimSchema.parse({ ...validClaim, roles: 'admin' })).toThrow();
  });

  it('aceita roles vazio (sem permissão)', () => {
    expect(() => TenantClaimSchema.parse({ ...validClaim, roles: [] })).not.toThrow();
  });

  it('infere TenantClaim corretamente', () => {
    const parsed = TenantClaimSchema.parse(validClaim);
    expectTypeOf(parsed).toExtend<TenantClaim>();
  });
});

describe('Tenant schemas JSON Schema snapshots', () => {
  it('TenantIdSchema', () => {
    expect(zodToJsonSchema(TenantIdSchema, { name: 'TenantId' })).toMatchSnapshot();
  });

  it('TenantClaimSchema', () => {
    expect(zodToJsonSchema(TenantClaimSchema, { name: 'TenantClaim' })).toMatchSnapshot();
  });
});
