import { Buffer } from 'node:buffer';

import type { AppEnv } from '../../src/shared/env/env.js';

/**
 * Fixture com env válido completo. Sempre que adicionarmos novo
 * campo ao schema, atualizamos aqui — evita repetir em N test files.
 */
export const buildValidEnv = (overrides: Partial<NodeJS.ProcessEnv> = {}): NodeJS.ProcessEnv => {
  const base64Secret = Buffer.alloc(32, 'a').toString('base64');
  return {
    BOOTSTRAP_TOKEN_HASH:
      '$argon2id$v=19$m=19456,t=2,p=1$c29tZS1zYWx0LWZvci10ZXN0$wOGGvT0sV9N5cIKx2Q/qX0E0c8oQjHJ4mY9QY5dQ8WI',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/mais_inclusao_auth?schema=auth',
    EMAIL_HASH_PEPPER: base64Secret,
    JWT_KID: 'auth-test',
    JWT_PRIVATE_KEY_BASE64: 'cHJpdmF0ZQ==',
    JWT_PUBLIC_KEY_BASE64: 'cHVibGlj',
    KMS_KID: 'kms-test',
    KMS_MASTER_KEY_BASE64: base64Secret,
    ...overrides,
  };
};

export const buildValidEnvParsed = (): AppEnv => ({
  BOOTSTRAP_TOKEN_HASH:
    '$argon2id$v=19$m=19456,t=2,p=1$c29tZS1zYWx0LWZvci10ZXN0$wOGGvT0sV9N5cIKx2Q/qX0E0c8oQjHJ4mY9QY5dQ8WI',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/mais_inclusao_auth?schema=auth',
  EMAIL_HASH_PEPPER: Buffer.alloc(32, 'a').toString('base64'),
  JWT_ACCESS_TTL_SECONDS: 900,
  JWT_KID: 'auth-test',
  JWT_PRIVATE_KEY_BASE64: 'cHJpdmF0ZQ==',
  JWT_PUBLIC_KEY_BASE64: 'cHVibGlj',
  JWT_REFRESH_TTL_SECONDS: 604_800,
  KMS_KID: 'kms-test',
  KMS_MASTER_KEY_BASE64: Buffer.alloc(32, 'a').toString('base64'),
  KMS_PROVIDER: 'local',
  LOG_LEVEL: 'silent',
  NATS_STREAM: 'mais-inclusao',
  NATS_URL: 'nats://localhost:4222',
  NODE_ENV: 'test',
  OUTBOX_BATCH_SIZE: 50,
  OUTBOX_DISPATCH_INTERVAL_MS: 2_000,
  PORT: 3020,
});
