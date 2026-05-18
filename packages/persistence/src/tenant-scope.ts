import type { TenantClaim, TenantId } from '@mais-inclusao/contracts/shared';

import { CrossTenantAccessAttemptError } from './errors.js';
import { getRequiredTenantContext } from './tenant-context.js';

export interface TenantScopedInput {
  readonly tenant_id?: TenantId;
  readonly [key: string]: unknown;
}

export interface TenantScopeOptions {
  readonly operation?: string;
}

export type TenantScopedWhere<TWhere extends TenantScopedInput | undefined> =
  TWhere extends TenantScopedInput
    ? Omit<TWhere, 'tenant_id'> & { readonly tenant_id: TenantId }
    : { readonly tenant_id: TenantId };

export const assertTenantMatchesContext = (
  tenantId: TenantId,
  tenantContext: TenantClaim = getRequiredTenantContext(),
  options: TenantScopeOptions = {},
): TenantId => {
  if (tenantId !== tenantContext.tenant_id) {
    throw new CrossTenantAccessAttemptError({
      expectedTenantId: tenantContext.tenant_id,
      receivedTenantId: tenantId,
      operation: options.operation,
    });
  }

  return tenantId;
};

export const scopeTenantWhere = <TWhere extends TenantScopedInput | undefined>(
  where?: TWhere,
  tenantContext: TenantClaim = getRequiredTenantContext(),
  options: TenantScopeOptions = {},
): TenantScopedWhere<TWhere> => {
  if (where?.tenant_id !== undefined) {
    assertTenantMatchesContext(where.tenant_id, tenantContext, options);
  }

  if (where === undefined) {
    return {
      tenant_id: tenantContext.tenant_id,
    } as TenantScopedWhere<TWhere>;
  }

  // `as unknown as` necessário: TypeScript não infere que `{...where, tenant_id}`
  // satisfaz `Omit<TWhere, 'tenant_id'> & { readonly tenant_id }` por causa
  // do brand em TenantId + `readonly` no shape alvo. Cast seguro porque
  // estamos garantindo o shape manualmente.
  return {
    ...where,
    tenant_id: tenantContext.tenant_id,
  } as unknown as TenantScopedWhere<TWhere>;
};
