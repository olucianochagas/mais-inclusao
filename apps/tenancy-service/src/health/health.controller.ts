import { Controller, Get, HttpCode } from '@nestjs/common';

import { KmsHealthService } from '../kms/kms-health.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface HealthResponse {
  readonly service: 'tenancy-service';
  readonly status: 'ok' | 'error';
  readonly checks: Record<string, 'up' | 'down'>;
}

/**
 * Health endpoints — públicos (sem AuthGuard).
 *
 * /health/live  → liveness: o processo está rodando e respondendo HTTP.
 *                 Não toca em deps. Usado por k8s liveness probe.
 *
 * /health/ready → readiness: o processo está pronto para receber tráfego.
 *                 Verifica DB + KMS. Falha = remove pod do load balancer.
 */
@Controller('health')
export class HealthController {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly kms: KmsHealthService,
  ) {}

  @Get('live')
  @HttpCode(200)
  public live(): HealthResponse {
    return {
      checks: {},
      service: 'tenancy-service',
      status: 'ok',
    };
  }

  @Get('ready')
  @HttpCode(200)
  public async ready(): Promise<HealthResponse> {
    const checks: Record<string, 'up' | 'down'> = {};

    try {
      await this.prisma.ping();
      checks.database = 'up';
    } catch {
      checks.database = 'down';
    }

    try {
      await this.kms.ping();
      checks.kms = 'up';
    } catch {
      checks.kms = 'down';
    }

    const allUp = Object.values(checks).every((value) => value === 'up');
    return {
      checks,
      service: 'tenancy-service',
      status: allUp ? 'ok' : 'error',
    };
  }
}
