import { z } from 'zod';

/**
 * Padrão de erro HTTP unificado conforme RFC 9457 (Problem Details for HTTP APIs).
 *
 * Todo BFF e service retornam este shape em erros 4xx/5xx.
 *
 * Importante (LGPD): NÃO incluir PII em `detail`, `instance` ou
 * `errors[].message` que são enviados ao cliente. Detalhes de PII vão em
 * logs do servidor, com `correlation_id` ligando log à resposta.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc9457
 */
export const ProblemDetailsSchema = z.object({
  /**
   * URI que identifica o tipo do erro.
   * Default 'about:blank' indica erro genérico sem doc específica.
   */
  type: z.string().url().default('about:blank'),

  /** Resumo curto, legível por humano. Não muda entre instâncias. */
  title: z.string(),

  /** Status HTTP (100-599). */
  status: z.number().int().min(100).max(599),

  /** Detalhe específico desta instância (sem PII!). */
  detail: z.string().optional(),

  /** URI da instância (e.g., link para o request_id em log). */
  instance: z.string().optional(),

  // ─── Extensions específicas do +Inclusão (permitido por RFC 9457 § 3.2) ───

  /** UUID que liga esta resposta a logs do servidor (sem PII). */
  correlation_id: z.string().uuid().optional(),

  /** Lista de erros de validação por campo. */
  errors: z
    .array(
      z.object({
        /** Path JSON do campo com erro, e.g., "body.email". */
        path: z.string(),
        /** Código semântico do erro. */
        code: z.string(),
        /** Mensagem amigável (sem PII!). */
        message: z.string(),
      }),
    )
    .optional(),
});

export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;
