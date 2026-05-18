import { z } from 'zod';

import { TenantIdSchema, UserIdSchema } from '../shared/index.js';

/**
 * DTOs HTTP do auth-service.
 *
 * Mínimos para o primeiro release — apenas autenticação básica.
 * Tenants CRUD, Users CRUD, Roles management entram com a implementação
 * do auth-service no próximo ciclo.
 */

// ─── POST /auth/login ────────────────────────────────────────

export const LoginRequestSchema = z.object({
  /** Email RFC 5321 (max 254 chars). */
  email: z.string().email().max(254),

  /**
   * Senha entre 12 e 256 chars.
   * - Min 12: boa prática moderna (NIST SP 800-63B).
   * - Max 256: defesa DoS contra hash custoso de argon2id.
   */
  password: z.string().min(12).max(256),

  /** Slug do tenant onde o usuário se autentica. */
  tenant_slug: z.string().min(1).max(64),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  /** JWT short-lived (default 15min). */
  access_token: z.string(),

  /** Refresh token long-lived (default 7d), rotated em cada use. */
  refresh_token: z.string(),

  /** Tempo até expiração do access_token, em segundos. */
  expires_in: z.number().int().positive(),

  /** Único valor aceito: 'Bearer'. */
  token_type: z.literal('Bearer'),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// ─── POST /auth/refresh ──────────────────────────────────────

export const RefreshRequestSchema = z.object({
  refresh_token: z.string(),
});
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;

export const RefreshResponseSchema = LoginResponseSchema;
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;

// ─── GET /me ─────────────────────────────────────────────────

/**
 * Dados do próprio usuário autenticado.
 *
 * **LGPD Art. 18 II** — titular tem direito de acesso aos próprios dados.
 * Por isso este DTO inclui `email` (PII L2): o usuário está requisitando
 * seus próprios dados, é o caso autorizado.
 *
 * Outros endpoints que listam usuários (futuro `/tenants/:id/users`)
 * NÃO devem retornar email — apenas IDs + name redacted/short.
 */
export const MeResponseSchema = z.object({
  user: z.object({
    user_id: UserIdSchema,
    name: z.string().min(1),
    /** Autorizado LGPD Art. 18 II (acesso aos próprios dados). */
    email: z.string().email(),
  }),
  tenant: z.object({
    tenant_id: TenantIdSchema,
    slug: z.string().min(1),
    name: z.string().min(1),
  }),
  roles: z.array(z.string()),
});
export type MeResponse = z.infer<typeof MeResponseSchema>;
