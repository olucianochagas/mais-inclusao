import { z } from 'zod';

import { EventEnvelopeSchema } from '../shared/event-envelope.js';
import { TenantIdSchema, UserIdSchema } from '../shared/index.js';

// ─── auth.tenant.created ─────────────────────────────────────

/**
 * Tenant foi provisionado (via CLI ou painel admin futuro).
 *
 * Sem email, telefone ou outros PII do operador — apenas IDs e fatos.
 */
export const TenantCreatedPayloadSchema = z.object({
  tenant_id: TenantIdSchema,
  slug: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  plan: z.enum(['free', 'starter', 'pro', 'enterprise']),
  created_at: z.string().datetime({ offset: true }),
  /** Identifier do operador SaaS que provisionou (não é UserId interno). */
  created_by: z.string().min(1),
});

export const TenantCreatedEventSchema = EventEnvelopeSchema(
  TenantCreatedPayloadSchema,
);
export type TenantCreatedPayload = z.infer<typeof TenantCreatedPayloadSchema>;
export type TenantCreatedEvent = z.infer<typeof TenantCreatedEventSchema>;

// ─── auth.tenant.deactivated ─────────────────────────────────

/**
 * Tenant foi desativado. Consumer programs-service encerra programs órfãos.
 */
export const TenantDeactivatedPayloadSchema = z.object({
  tenant_id: TenantIdSchema,
  deactivated_at: z.string().datetime({ offset: true }),
  /** `data_breach` aciona protocolos LGPD. */
  reason: z.enum(['contract_ended', 'data_breach', 'unpaid', 'manual']),
});

export const TenantDeactivatedEventSchema = EventEnvelopeSchema(
  TenantDeactivatedPayloadSchema,
);
export type TenantDeactivatedPayload = z.infer<
  typeof TenantDeactivatedPayloadSchema
>;
export type TenantDeactivatedEvent = z.infer<
  typeof TenantDeactivatedEventSchema
>;

// ─── auth.user.created ───────────────────────────────────────

/**
 * Usuário gestor foi criado em um tenant.
 *
 * **IMPORTANTE (LGPD)**: NÃO inclui email, nome ou outros PII no payload.
 * Consumer que precisa fazer lookup faz via auth-service autenticado.
 */
export const UserCreatedPayloadSchema = z.object({
  user_id: UserIdSchema,
  tenant_id: TenantIdSchema,
  /** Pelo menos 1 role. Sem roles = usuário inútil. */
  roles: z.array(z.string()).min(1),
  created_at: z.string().datetime({ offset: true }),
});

export const UserCreatedEventSchema = EventEnvelopeSchema(
  UserCreatedPayloadSchema,
);
export type UserCreatedPayload = z.infer<typeof UserCreatedPayloadSchema>;
export type UserCreatedEvent = z.infer<typeof UserCreatedEventSchema>;

// ─── auth.user.deactivated ───────────────────────────────────

/**
 * Usuário foi desativado.
 *
 * Consumer applications-service reatribui applications em triagem deste usuário.
 */
export const UserDeactivatedPayloadSchema = z.object({
  user_id: UserIdSchema,
  tenant_id: TenantIdSchema,
  deactivated_at: z.string().datetime({ offset: true }),
  reason: z.enum([
    'voluntary',
    'role_revoked',
    'security_incident',
    'data_breach',
  ]),
});

export const UserDeactivatedEventSchema = EventEnvelopeSchema(
  UserDeactivatedPayloadSchema,
);
export type UserDeactivatedPayload = z.infer<
  typeof UserDeactivatedPayloadSchema
>;
export type UserDeactivatedEvent = z.infer<typeof UserDeactivatedEventSchema>;
