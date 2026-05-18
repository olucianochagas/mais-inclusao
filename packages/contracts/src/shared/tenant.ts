import { z } from 'zod';

/**
 * Identificador único de tenant (organização que opera no +Inclusão).
 *
 * UUID v4 branded — impede passar string crua onde TenantId é esperado.
 * Em runtime é apenas string; o brand vive apenas no sistema de tipos.
 *
 * @example
 * const tenantId: TenantId = TenantIdSchema.parse('550e8400-...');
 */
export const TenantIdSchema = z.string().uuid().brand<'TenantId'>();
export type TenantId = z.infer<typeof TenantIdSchema>;

/**
 * Claim do JWT lido por cada Guard de aplicação.
 *
 * Materializado no AsyncLocalStorage de cada request. Repository base
 * usa essas informações para injetar `WHERE tenant_id = ...` em queries.
 *
 * Ver ADR-0005 — Multi-tenancy com defesa em profundidade.
 */
export const TenantClaimSchema = z.object({
  tenant_id: TenantIdSchema,
  user_id: z.string().uuid().brand<'UserId'>(),
  roles: z.array(z.string()),
});
export type TenantClaim = z.infer<typeof TenantClaimSchema>;
