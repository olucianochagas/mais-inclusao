import 'reflect-metadata';

import { HttpStatus, Logger, type ValidationError,ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from './app.module.js';
import { EnvService } from './shared/env/env.service.js';
import { ProblemDetailsException } from './shared/problem-details.exception.js';
import { ProblemDetailsFilter } from './shared/problem-details.filter.js';
import { flattenValidationErrors } from './shared/validation-error.formatter.js';

/**
 * Boot do tenancy-service via Fastify adapter (2-3x mais throughput que
 * Express; Pino é o logger nativo do Fastify).
 *
 * Stack de validação: ValidationPipe global do NestJS + class-validator +
 * class-transformer. O `exceptionFactory` normaliza `ValidationError[]`
 * em `ProblemDetailsException` (RFC 9457), mantendo o mesmo envelope
 * de erro que o ProblemDetailsFilter já trata.
 */
const bootstrap = async (): Promise<void> => {
  const adapter = new FastifyAdapter({
    bodyLimit: 1_048_576, // 1 MiB — defesa contra payload bomb em POST /auth/login
    trustProxy: true, // X-Forwarded-For do ingress controller é confiável
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: true,
  });

  const envService = app.get(EnvService);
  const { PORT } = envService.values;

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors: ValidationError[]) =>
        new ProblemDetailsException({
          detail: 'One or more fields are invalid',
          errors: flattenValidationErrors(errors),
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          title: 'Request validation failed',
          type: 'https://docs.mais-inclusao/errors/validation-error',
        }),
    }),
  );

  app.useGlobalFilters(new ProblemDetailsFilter());
  app.enableShutdownHooks();

  await app.listen(PORT, '0.0.0.0');
};

void bootstrap().catch((reason: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error(reason instanceof Error ? reason.stack : String(reason));
  process.exitCode = 1;
});
