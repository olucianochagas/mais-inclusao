import { CORRELATION_ID_HEADER, createCorrelationId, normalizeCorrelationId } from '@mais-inclusao/observability';
import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

import { runWithCorrelationId } from './correlation-id.context.js';

/**
 * Extrai o correlation_id do header `x-correlation-id` (ou gera UUID v4
 * novo se ausente/inválido) e popula o AsyncLocalStorage durante toda
 * a request. Qualquer service downstream pode chamar `getCorrelationId()`
 * para correlacionar logs e eventos.
 */
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  public intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = ctx.switchToHttp().getRequest<{
      readonly headers: Record<string, string | string[] | undefined>;
    }>();
    // CORRELATION_ID_HEADER é constante hardcoded ('x-correlation-id'),
    // não input dinâmico — safe contra object injection.
    // eslint-disable-next-line security/detect-object-injection
    const headerValue = request.headers[CORRELATION_ID_HEADER];
    const candidate = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    const normalized = normalizeCorrelationId(candidate);
    const correlationId = normalized ?? createCorrelationId();

    return new Observable((subscriber) => {
      runWithCorrelationId(correlationId, () => {
        next.handle().subscribe({
          complete: () => { subscriber.complete(); },
          error: (e: unknown) => { subscriber.error(e); },
          next: (value: unknown) => { subscriber.next(value); },
        });
      });
    });
  }
}
