import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

/**
 * Types mínimos do que precisamos da response/request HTTP.
 * Compatível com Express e Fastify por duck typing — evita acoplar a
 * `@types/express` ou `fastify` diretamente. O ProblemDetails é
 * agnóstico de adapter.
 */
interface ResponseLike {
  setHeader(name: string, value: string): unknown;
  status(code: number): ResponseLike;
  send(body: unknown): unknown;
}

interface RequestLike {
  readonly url: string;
}

/**
 * Global ExceptionFilter que normaliza qualquer erro em ProblemDetails
 * RFC 9457 com Content-Type `application/problem+json`.
 *
 * - HttpException com body objeto (ex.: ProblemDetailsException ou Nest
 *   legacy {statusCode, message, error}) → preserva campos + injeta
 *   defaults de `type`/`title`.
 * - HttpException com body string → wrappa em ProblemDetails genérico.
 * - Erros não-HTTP → 500 com type=internal (sem vazar stack).
 *
 * Por que `send()` em vez de `json()`: Fastify expõe `send()`,
 * Express expõe `json()`. Para ser cross-adapter-friendly via duck
 * typing, usamos `send()` — Express's `send()` também serializa JSON
 * quando o body é objeto.
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<ResponseLike>();
    const request = ctx.getRequest<RequestLike>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: Record<string, unknown> = {
      instance: request.url,
      status,
      title: 'Internal server error',
      type: 'https://docs.mais-inclusao/errors/internal',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const raw = exception.getResponse();

      if (typeof raw === 'object') {
        const rawObject = raw as Record<string, unknown>;
        const fallbackTitle =
          (typeof rawObject.error === 'string' && rawObject.error) ||
          (typeof rawObject.message === 'string' && rawObject.message) ||
          'Error';
        body = {
          type: 'https://docs.mais-inclusao/errors/generic',
          title: fallbackTitle,
          ...rawObject,
          instance: request.url,
          status,
        };
      } else {
        const title = typeof raw === 'string' ? raw : 'Error';
        body = {
          instance: request.url,
          status,
          title,
          type: 'https://docs.mais-inclusao/errors/generic',
        };
      }
    }

    response.setHeader('Content-Type', 'application/problem+json');
    response.status(status).send(body);
  }
}
