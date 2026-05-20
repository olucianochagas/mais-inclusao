import { HttpException, type HttpStatus } from '@nestjs/common';

/**
 * Body conforme RFC 9457 (Problem Details for HTTP APIs).
 * Index signature permite extensions (errors[], correlation_id, etc.).
 */
export interface ProblemDetailsBody {
  readonly type: string;
  readonly title: string;
  readonly status: HttpStatus;
  readonly detail?: string;
  readonly instance?: string;
  readonly [extension: string]: unknown;
}

/**
 * HttpException tipada com payload ProblemDetails.
 * O ProblemDetailsFilter (global) serializa esse body com
 * Content-Type `application/problem+json`.
 */
export class ProblemDetailsException extends HttpException {
  public constructor(body: ProblemDetailsBody) {
    super(body, body.status);
  }
}
