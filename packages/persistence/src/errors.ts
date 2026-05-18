import type { TenantId } from '@mais-inclusao/contracts/shared';

export const MISSING_TENANT_CONTEXT = 'MISSING_TENANT_CONTEXT';
export const CROSS_TENANT_ACCESS_ATTEMPT = 'CROSS_TENANT_ACCESS_ATTEMPT';

export class MissingTenantContextError extends Error {
  public readonly code = MISSING_TENANT_CONTEXT;

  public constructor(message = 'TenantContext ausente para operação multi-tenant.') {
    super(message);
    this.name = 'MissingTenantContextError';
  }
}

export interface CrossTenantAccessAttemptDetails {
  readonly expectedTenantId: TenantId;
  readonly receivedTenantId: TenantId;
  readonly operation?: string;
}

export class CrossTenantAccessAttemptError extends Error {
  public readonly code = CROSS_TENANT_ACCESS_ATTEMPT;
  public readonly expectedTenantId: TenantId;
  public readonly receivedTenantId: TenantId;
  public readonly operation?: string;

  public constructor(details: CrossTenantAccessAttemptDetails) {
    const suffix = details.operation === undefined ? '' : ` em ${details.operation}`;

    super(
      `Tentativa de acesso cross-tenant${suffix}: esperado ` +
        `${details.expectedTenantId}, recebido ${details.receivedTenantId}.`,
    );

    this.name = 'CrossTenantAccessAttemptError';
    this.expectedTenantId = details.expectedTenantId;
    this.receivedTenantId = details.receivedTenantId;
    this.operation = details.operation;
  }
}
