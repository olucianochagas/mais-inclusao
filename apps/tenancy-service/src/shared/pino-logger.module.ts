import { buildLoggerOptions } from '@mais-inclusao/observability';
import { Global, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { EnvModule } from './env/env.module.js';
import { EnvService } from './env/env.service.js';

/**
 * Logger Pino global via nestjs-pino.
 *
 * Nota: o Fastify já tem Pino integrado nativamente, mas mantemos
 * nestjs-pino na frente porque:
 * - controle fino de bindings/redaction via @mais-inclusao/observability
 * - mesma API entre HTTP context e service context (`Logger` injetável)
 * - migração futura para outros adapters sem mudar consumers
 *
 * O `buildLoggerOptions` de @mais-inclusao/observability já injeta
 * DEFAULT_REDACT_PATHS (email, cpf, telefone, password).
 */
@Global()
@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        pinoHttp: buildLoggerOptions({
          serviceName: 'tenancy-service',
          level: env.values.LOG_LEVEL,
          environment: env.values.NODE_ENV,
        }),
      }),
    }),
  ],
  exports: [LoggerModule],
})
export class PinoLoggerModule {}
