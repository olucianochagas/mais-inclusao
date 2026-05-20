import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * AsyncLocalStorage que carrega o correlation_id da requisição corrente.
 *
 * Populado pelo CorrelationIdInterceptor (Nest) no início de cada
 * request HTTP. Acessível em qualquer service via `getCorrelationId()`,
 * sem precisar passar como parâmetro.
 *
 * Quando o pattern alcançar maturidade (múltiplos services usando),
 * promover para `@mais-inclusao/observability`. Por ora vive aqui
 * para evitar premature abstraction (YAGNI).
 */
const storage = new AsyncLocalStorage<{ readonly correlation_id: string }>();

export const runWithCorrelationId = <T>(correlationId: string, fn: () => T): T =>
  storage.run({ correlation_id: correlationId }, fn);

export const getCorrelationId = (): string | undefined => storage.getStore()?.correlation_id;
