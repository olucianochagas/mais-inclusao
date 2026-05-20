import { Buffer } from 'node:buffer';

import { describe, expect, it } from 'vitest';

import { parseEnv } from '../src/shared/env/env.js';
import { buildValidEnv } from './helpers/env-fixture.js';

describe('parseEnv', () => {
  it('aplica defaults seguros quando opcionais ausentes', () => {
    expect(parseEnv(buildValidEnv())).toMatchObject({
      JWT_ACCESS_TTL_SECONDS: 900,
      JWT_REFRESH_TTL_SECONDS: 604_800,
      KMS_PROVIDER: 'local',
      LOG_LEVEL: 'info',
      NATS_STREAM: 'mais-inclusao',
      NATS_URL: 'nats://localhost:4222',
      NODE_ENV: 'development',
      OUTBOX_BATCH_SIZE: 50,
      OUTBOX_DISPATCH_INTERVAL_MS: 2_000,
      PORT: 3010,
    });
  });

  it('falha quando DATABASE_URL ausente', () => {
    expect(() => parseEnv(buildValidEnv({ DATABASE_URL: undefined }))).toThrow(/DATABASE_URL/u);
  });

  it('exige segredo KMS local com 32 bytes em base64', () => {
    expect(() =>
      parseEnv(buildValidEnv({ KMS_MASTER_KEY_BASE64: Buffer.alloc(16, 'a').toString('base64') })),
    ).toThrow(/KMS_MASTER_KEY_BASE64/u);
  });

  it('rejeita BOOTSTRAP_TOKEN_HASH em texto plano (não-argon2id)', () => {
    expect(() => parseEnv(buildValidEnv({ BOOTSTRAP_TOKEN_HASH: 'plain-text' }))).toThrow(
      /BOOTSTRAP_TOKEN_HASH/u,
    );
  });

  it('exige EMAIL_HASH_PEPPER com 32 bytes em base64', () => {
    expect(() =>
      parseEnv(buildValidEnv({ EMAIL_HASH_PEPPER: Buffer.alloc(8, 'a').toString('base64') })),
    ).toThrow(/EMAIL_HASH_PEPPER/u);
  });
});
