import { Buffer } from 'node:buffer';

import { z } from 'zod';

/**
 * Schema de env vars do auth-service Onda 1.
 *
 * Validado via Zod no boot (antes do Nest container subir). Falha de
 * configuração interrompe startup com mensagem clara.
 *
 * NOTA: usamos Zod aqui (não class-validator) porque env validation roda
 * fora do contexto NestJS — é puro Node.js no início de main.ts.
 * class-validator é reservado para DTOs HTTP onde o ValidationPipe global
 * faz a inferência via metadata reflection.
 */

const integerFromEnv = (defaultValue: number) =>
  z.preprocess(
    (value) => (value === undefined || value === '' ? defaultValue : value),
    z.coerce.number().int().positive(),
  );

const base64Bytes = (expectedBytes: number) =>
  z
    .string()
    .min(1)
    .refine(
      (value) => {
        try {
          return Buffer.from(value, 'base64').length === expectedBytes;
        } catch {
          return false;
        }
      },
      `Must be base64 encoded ${String(expectedBytes)} bytes.`,
    );

const base64Pem = z.string().min(1);

export const AppEnvSchema = z.object({
  BOOTSTRAP_TOKEN_HASH: z.string().startsWith('$argon2id$').min(80).max(255),
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  EMAIL_HASH_PEPPER: base64Bytes(32),
  JWT_ACCESS_TTL_SECONDS: integerFromEnv(900),
  JWT_KID: z.string().min(1),
  JWT_PRIVATE_KEY_BASE64: base64Pem,
  JWT_PUBLIC_KEY_BASE64: base64Pem,
  JWT_REFRESH_TTL_SECONDS: integerFromEnv(604_800),
  KMS_KID: z.string().min(1),
  KMS_MASTER_KEY_BASE64: base64Bytes(32),
  KMS_PROVIDER: z.literal('local').default('local'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),
  NATS_STREAM: z.string().min(1).default('mais-inclusao'),
  NATS_URL: z.string().url().default('nats://localhost:4222'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  OUTBOX_BATCH_SIZE: integerFromEnv(50),
  OUTBOX_DISPATCH_INTERVAL_MS: integerFromEnv(2_000),
  PORT: integerFromEnv(3010),
});

export type AppEnv = z.infer<typeof AppEnvSchema>;

export const parseEnv = (env: NodeJS.ProcessEnv): AppEnv => {
  const parsed = AppEnvSchema.safeParse(env);

  if (parsed.success) {
    return parsed.data;
  }

  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');

  throw new Error(`Invalid auth-service environment: ${details}`);
};
