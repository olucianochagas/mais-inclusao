import { describe, expect, it } from 'vitest';

import {
  bootstrapOpenTelemetry,
  buildOpenTelemetryEnvironment,
  shutdownOpenTelemetry,
} from '../src/otel.js';

describe('otel helpers', () => {
  it('builds a stable OTel environment payload', () => {
    expect(
      buildOpenTelemetryEnvironment({
        serviceName: 'auth-service',
        serviceVersion: '1.2.3',
        environment: 'dev',
        resourceAttributes: {
          'team.name': 'foundation',
        },
      }),
    ).toEqual({
      OTEL_SERVICE_NAME: 'auth-service',
      OTEL_RESOURCE_ATTRIBUTES:
        'service.name=auth-service,service.version=1.2.3,deployment.environment=dev,team.name=foundation',
    });
  });

  it('creates an OTel bootstrap object and can shut it down', async () => {
    const sdk = bootstrapOpenTelemetry({
      serviceName: 'auth-service',
      enableAutoInstrumentations: false,
    });

    expect(sdk).toHaveProperty('start');
    await expect(shutdownOpenTelemetry(sdk)).resolves.toBeUndefined();
  });
});
