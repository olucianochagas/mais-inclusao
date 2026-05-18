import { TenantClaimSchema } from '@mais-inclusao/contracts/shared';
import { describe, expect, it } from 'vitest';

import {
  getRequiredTenantContext,
  getTenantContext,
  MissingTenantContextError,
  runWithTenantContext,
} from '../src/index.js';

const baseTenantContext = TenantClaimSchema.parse({
  tenant_id: '550e8400-e29b-41d4-a716-446655440000',
  user_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  roles: ['operator'],
});

const otherTenantContext = TenantClaimSchema.parse({
  tenant_id: '1f41c4a6-3b6b-4df1-8f1d-6a8c86a9b0d8',
  user_id: 'e7cbf3f0-b05f-4d76-b1ff-d2a9f352b898',
  roles: ['auditor'],
});

describe('tenant context', () => {
  it('retorna undefined quando não há contexto ativo', () => {
    expect(getTenantContext()).toBeUndefined();
  });

  it('falha alto quando contexto obrigatório está ausente', () => {
    expect(() => getRequiredTenantContext()).toThrow(MissingTenantContextError);
  });

  it('expõe TenantClaim dentro do escopo síncrono', () => {
    const tenantContext = runWithTenantContext(baseTenantContext, () => getRequiredTenantContext());

    expect(tenantContext).toEqual(baseTenantContext);
  });

  it('preserva TenantClaim em escopo assíncrono', async () => {
    const tenantContext = await runWithTenantContext(baseTenantContext, async () => {
      await Promise.resolve();
      return getRequiredTenantContext();
    });

    expect(tenantContext.tenant_id).toBe(baseTenantContext.tenant_id);
  });

  it('restaura contexto externo após escopo aninhado', () => {
    const tenantIds = runWithTenantContext(baseTenantContext, () => {
      const outerBefore = getRequiredTenantContext().tenant_id;

      const inner = runWithTenantContext(
        otherTenantContext,
        () => getRequiredTenantContext().tenant_id,
      );

      const outerAfter = getRequiredTenantContext().tenant_id;

      return { inner, outerAfter, outerBefore };
    });

    expect(tenantIds).toEqual({
      inner: otherTenantContext.tenant_id,
      outerAfter: baseTenantContext.tenant_id,
      outerBefore: baseTenantContext.tenant_id,
    });
  });
});
