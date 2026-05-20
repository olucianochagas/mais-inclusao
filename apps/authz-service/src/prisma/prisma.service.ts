import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
// Este service É o singleton PrismaClient — único lugar autorizado a importar
// PrismaClient direto. Repositories de feature modules consomem PrismaService
// (com TenantAwareRepository de @mais-inclusao/persistence quando aplicável).
// eslint-disable-next-line no-restricted-imports
import { PrismaClient } from '@prisma/client';

/**
 * Singleton PrismaClient com lifecycle hooks alinhados ao Nest module.
 *
 * `$connect()` no onModuleInit garante conexão estabelecida antes do
 * primeiro request HTTP. `$disconnect()` no onModuleDestroy permite
 * graceful shutdown sem deixar conexões abertas no Postgres.
 *
 * O `ping()` é usado pelo HealthController em /health/ready.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  public async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  public async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** Round-trip simples para health check. */
  public async ping(): Promise<void> {
    await this.$queryRaw`SELECT 1`;
  }
}
