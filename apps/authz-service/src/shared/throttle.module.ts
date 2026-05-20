import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule as NestThrottlerModule } from '@nestjs/throttler';

/**
 * Rate limiting via @nestjs/throttler com 4 named limits para defesa em
 * profundidade contra brute force e abuso de endpoints sensíveis
 * (RFC 6819).
 *
 * Cada endpoint declara qual named limit aplicar via `@Throttle({ <name>: {} })`.
 * Storage padrão in-memory; trocar para Redis quando houver múltiplas
 * réplicas do auth-service em produção.
 */
@Module({
  imports: [
    NestThrottlerModule.forRoot([
      { limit: 100, name: 'default', ttl: 60_000 },
      { limit: 5, name: 'auth-login', ttl: 60_000 },
      { limit: 60, name: 'auth-refresh', ttl: 60_000 },
      { limit: 1000, name: 'jwks', ttl: 60_000 },
    ]),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
  exports: [NestThrottlerModule],
})
export class ThrottleModule {}
