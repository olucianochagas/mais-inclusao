import { TenantClaimSchema, TenantIdSchema } from '@mais-inclusao/contracts/shared';
import { describe, expect, it } from 'vitest';

import {
  assertTenantMatchesContext,
  CrossTenantAccessAttemptError,
  MissingTenantContextError,
  scopeTenantWhere,
} from '../src/index.js';

const tenantContext = TenantClaimSchema.parse({
  tenant_id: '550e8400-e29b-41d4-a716-446655440000',
  user_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  roles: ['admin'],
});

const otherTenantId = TenantIdSchema.parse('1f41c4a6-3b6b-4df1-8f1d-6a8c86a9b0d8');

describe('scopeTenantWhere', () => {
  it('injeta tenant_id quando where está vazio', () => {
    expect(scopeTenantWhere(undefined, tenantContext)).toEqual({
      tenant_id: tenantContext.tenant_id,
    });
  });

  it('preserva filtros existentes e injeta tenant_id do contexto', () => {
    const where = scopeTenantWhere(
      { status: 'active', name: { contains: 'Centro' } },
      tenantContext,
    );

    expect(where).toEqual({
      name: { contains: 'Centro' },
      status: 'active',
      tenant_id: tenantContext.tenant_id,
    });
  });

  it('aceita tenant_id explícito quando ele bate com o contexto', () => {
    const where = scopeTenantWhere(
      { tenant_id: tenantContext.tenant_id, status: 'active' },
      tenantContext,
    );

    expect(where.tenant_id).toBe(tenantContext.tenant_id);
  });

  it('rejeita tenant_id explícito de outro tenant', () => {
    expect(() =>
      scopeTenantWhere({ tenant_id: otherTenantId }, tenantContext, {
        operation: 'program.findMany',
      }),
    ).toThrow(CrossTenantAccessAttemptError);
  });

  it('exige TenantContext quando contexto não é informado', () => {
    expect(() => scopeTenantWhere()).toThrow(MissingTenantContextError);
  });
});

describe('assertTenantMatchesContext', () => {
  it('retorna tenant_id quando bate com o contexto', () => {
    expect(assertTenantMatchesContext(tenantContext.tenant_id, tenantContext)).toBe(
      tenantContext.tenant_id,
    );
  });

  it('inclui detalhes úteis no erro cross-tenant', () => {
    let crossTenantError: CrossTenantAccessAttemptError | undefined;

    try {
      assertTenantMatchesContext(otherTenantId, tenantContext, {
        operation: 'application.update',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(CrossTenantAccessAttemptError);
      crossTenantError = error as CrossTenantAccessAttemptError;
    }

    expect(crossTenantError).toBeDefined();
    expect(crossTenantError?.code).toBe('CROSS_TENANT_ACCESS_ATTEMPT');
    expect(crossTenantError?.expectedTenantId).toBe(tenantContext.tenant_id);
    expect(crossTenantError?.receivedTenantId).toBe(otherTenantId);
    expect(crossTenantError?.operation).toBe('application.update');
  });
});
