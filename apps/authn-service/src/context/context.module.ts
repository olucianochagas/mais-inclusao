import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { CorrelationIdInterceptor } from './correlation-id.interceptor.js';

/**
 * @Global porque correlation_id é cross-cutting concern. Registra
 * o interceptor via APP_INTERCEPTOR — Nest aplica em toda request.
 */
@Global()
@Module({
  providers: [{ provide: APP_INTERCEPTOR, useClass: CorrelationIdInterceptor }],
})
export class ContextModule {}
