import { describe, expect, it, vi } from 'vitest';

import { HealthController } from '../src/health/health.controller.js';
import type { KmsHealthService } from '../src/kms/kms-health.service.js';
import type { PrismaService } from '../src/prisma/prisma.service.js';

const buildController = (
  databasePing: () => Promise<void>,
  kmsPing: () => Promise<void> = vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
): HealthController =>
  new HealthController({ ping: databasePing } as PrismaService, { ping: kmsPing } as KmsHealthService);

describe('HealthController', () => {
  it('retorna live sem depender de infraestrutura externa', () => {
    const controller = buildController(vi.fn());
    expect(controller.live()).toEqual({
      checks: {},
      service: 'auth-service',
      status: 'ok',
    });
  });

  it('retorna ready=ok quando DB e KMS respondem', async () => {
    const controller = buildController(
      vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    );
    await expect(controller.ready()).resolves.toEqual({
      checks: { database: 'up', kms: 'up' },
      service: 'auth-service',
      status: 'ok',
    });
  });

  it('retorna ready=error quando DB cai', async () => {
    const controller = buildController(
      vi.fn<() => Promise<void>>().mockRejectedValue(new Error('db down')),
    );
    const result = await controller.ready();
    expect(result.status).toBe('error');
    expect(result.checks.database).toBe('down');
    expect(result.checks.kms).toBe('up');
  });

  it('retorna ready=error quando KMS cai', async () => {
    const controller = buildController(
      vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      vi.fn<() => Promise<void>>().mockRejectedValue(new Error('kms down')),
    );
    const result = await controller.ready();
    expect(result.status).toBe('error');
    expect(result.checks.kms).toBe('down');
  });
});
