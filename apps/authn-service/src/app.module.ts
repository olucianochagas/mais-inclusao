import { Module } from '@nestjs/common';

import { ContextModule } from './context/context.module.js';
import { HealthModule } from './health/health.module.js';
import { KmsModule } from './kms/kms.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { EnvModule } from './shared/env/env.module.js';
import { PinoLoggerModule } from './shared/pino-logger.module.js';
import { ThrottleModule } from './shared/throttle.module.js';

/**
 * AppModule do auth-service Onda 1 — scaffold inicial.
 *
 * Ordem dos imports é semanticamente significativa:
 * 1. EnvModule — primeiro, parse e valida env vars
 * 2. PinoLoggerModule — depende de env (LOG_LEVEL, NODE_ENV)
 * 3. ContextModule — interceptor de correlation_id em toda request
 * 4. ThrottleModule — global guard de rate limiting
 * 5. PrismaModule — DB singleton
 * 6. KmsModule — depende de env (KMS_MASTER_KEY_BASE64, KMS_KID)
 * 7. HealthModule — usa PrismaService + KmsHealthService
 *
 * Os feature modules de domínio (Auth, Tenant, User, Role, Outbox,
 * JWKS, CLI) serão adicionados aqui em ondas subsequentes do plano.
 */
@Module({
  imports: [
    EnvModule,
    PinoLoggerModule,
    ContextModule,
    ThrottleModule,
    PrismaModule,
    KmsModule,
    HealthModule,
  ],
})
export class AppModule {}
