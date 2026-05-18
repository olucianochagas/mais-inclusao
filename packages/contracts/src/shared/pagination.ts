import { z } from 'zod';

/**
 * Query string padrão de paginação cursor-based.
 *
 * Aplicado em todos endpoints `GET /<recurso>` que retornem coleção.
 * `limit` é coerce-friendly (query strings vêm como string).
 *
 * Limite max 100 — defesa contra DoS de queries grandes.
 */
export const PaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/**
 * Resultado paginado genérico.
 *
 * `next_cursor: null` indica que não há mais páginas.
 * `total_estimate` é opcional — alguns endpoints podem fornecê-lo se
 * for barato calcular; outros omitirão por custo de query.
 */
export const PaginatedResultSchema = <TItem extends z.ZodTypeAny>(
  item: TItem,
): z.ZodObject<{
  items: z.ZodArray<TItem>;
  next_cursor: z.ZodNullable<z.ZodString>;
  total_estimate: z.ZodOptional<z.ZodNumber>;
}> =>
  z.object({
    items: z.array(item),
    next_cursor: z.string().nullable(),
    total_estimate: z.number().int().nonnegative().optional(),
  });

export interface PaginatedResult<T> {
  items: T[];
  next_cursor: string | null;
  total_estimate?: number;
}
