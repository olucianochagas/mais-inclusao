import { z } from 'zod';

/**
 * Headers obrigatórios em todo evento publicado no NATS JetStream (+Inclusão).
 *
 * Materializa o padrão definido em ADR-0004 (Mensageria NATS JetStream + Outbox).
 *
 * Validação dupla obrigatória:
 * - Publicador valida ANTES de inserir no outbox_event.
 * - Consumer valida ANTES de processar (idempotência via event_id).
 *
 * Invariante crítica: `tenant_id` é obrigatório. Consumer rejeita eventos
 * sem ele (defesa de cross-tenant leak — ADR-0005, camada 5).
 *
 * @see docs/adr/0004-nats-jetstream-outbox-pattern.md
 * @see docs/adr/0005-multi-tenancy-defesa-em-profundidade.md
 */
export const EventHeadersSchema = z.object({
  /** UUID v4. Vira NATS Msg-ID. Garante dedup window de 2min do JetStream. */
  event_id: z.string().uuid(),

  /** Pattern `<context>.<entity>.<event>` em snake_case. */
  event_type: z.string().regex(/^[a-z_]+\.[a-z_]+\.[a-z_]+$/, {
    message: 'event_type deve seguir <context>.<entity>.<event> em snake_case',
  }),

  /** SemVer do payload. Major bump = breaking change exige Changeset. */
  event_version: z.string().regex(/^\d+\.\d+\.\d+$/, {
    message: 'event_version deve seguir SemVer (e.g. "1.0.0")',
  }),

  /** ISO 8601 com timezone obrigatório. */
  occurred_at: z.string().datetime({ offset: true }),

  /** UUID v4 branded. INVARIANTE — todo evento traz tenant_id. */
  tenant_id: z.string().uuid().brand<'TenantId'>(),

  /** UUID v4. Rastreia uma operação ponta-a-ponta. */
  correlation_id: z.string().uuid(),

  /** UUID do evento que causou este (cadeia). Null para raízes. */
  causation_id: z.string().uuid().nullable().default(null),

  /** Nome do serviço produtor (e.g., "auth-service"). */
  producer: z.string().min(1),
});

export type EventHeaders = z.infer<typeof EventHeadersSchema>;

/**
 * Constrói um schema de evento completo a partir do schema do payload.
 *
 * @example
 * const TenantCreatedSchema = EventEnvelopeSchema(
 *   z.object({ tenant_id: TenantIdSchema, name: z.string() })
 * );
 */
export const EventEnvelopeSchema = <TPayload extends z.ZodTypeAny>(
  payload: TPayload,
): z.ZodObject<{
  headers: typeof EventHeadersSchema;
  payload: TPayload;
}> =>
  z.object({
    headers: EventHeadersSchema,
    payload,
  });

/** Helper utilitário para typar resultado do envelope. */
export interface EventEnvelope<TPayload> {
  headers: EventHeaders;
  payload: TPayload;
}
