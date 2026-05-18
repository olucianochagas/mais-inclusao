import { AsyncLocalStorage } from 'node:async_hooks';

import type { TenantClaim } from '@mais-inclusao/contracts/shared';

import { MissingTenantContextError } from './errors.js';

const tenantContextStorage = new AsyncLocalStorage<TenantClaim>();

export const runWithTenantContext = <TResult>(
  tenantContext: TenantClaim,
  callback: () => TResult,
): TResult => tenantContextStorage.run(tenantContext, callback);

export const getTenantContext = (): TenantClaim | undefined => tenantContextStorage.getStore();

export const getRequiredTenantContext = (): TenantClaim => {
  const tenantContext = getTenantContext();

  if (tenantContext === undefined) {
    throw new MissingTenantContextError();
  }

  return tenantContext;
};
