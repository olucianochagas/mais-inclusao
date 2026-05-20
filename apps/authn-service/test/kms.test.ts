import { Buffer } from 'node:buffer';

import { TenantIdSchema } from '@mais-inclusao/contracts/shared';
import { AES_256_GCM_ALGORITHM } from '@mais-inclusao/persistence';
import { describe, expect, it } from 'vitest';

import { EncryptionService } from '../src/kms/encryption.service.js';
import { KmsHealthService } from '../src/kms/kms-health.service.js';
import { LocalKmsProvider } from '../src/kms/local-kms.provider.js';
import { EnvService } from '../src/shared/env/env.service.js';
import { buildValidEnvParsed } from './helpers/env-fixture.js';

const tenantA = TenantIdSchema.parse('550e8400-e29b-41d4-a716-446655440000');
const tenantB = TenantIdSchema.parse('1f41c4a6-3b6b-4df1-8f1d-6a8c86a9b0d8');

const buildEnvService = (): EnvService => new EnvService(buildValidEnvParsed());

describe('LocalKmsProvider', () => {
  it('deriva DEKs determinísticas por (tenant, nonce, kid, purpose)', () => {
    const provider = new LocalKmsProvider(buildEnvService());
    const nonce = Buffer.alloc(12, 7);

    const first = provider.deriveDek({ tenant_id: tenantA, nonce, purpose: 'auth.email' });
    const second = provider.deriveDek({ tenant_id: tenantA, nonce, purpose: 'auth.email' });
    const otherTenant = provider.deriveDek({ tenant_id: tenantB, nonce, purpose: 'auth.email' });
    const otherPurpose = provider.deriveDek({ tenant_id: tenantA, nonce, purpose: 'other' });

    expect(first.bytes).toEqual(second.bytes);
    expect(first.bytes).not.toEqual(otherTenant.bytes);
    expect(first.bytes).not.toEqual(otherPurpose.bytes);
    expect(first.algorithm).toBe(AES_256_GCM_ALGORITHM);
    expect(first.bytes).toHaveLength(32);
  });

  it('currentKid retorna o kid configurado em env', () => {
    const provider = new LocalKmsProvider(buildEnvService());
    expect(provider.currentKid(tenantA)).toBe('kms-test');
  });
});

describe('EncryptionService roundtrip', () => {
  it('cifra e decifra mantendo plaintext', async () => {
    const provider = new LocalKmsProvider(buildEnvService());
    const enc = new EncryptionService(provider);

    const plaintext = 'maria@x.gov.br';
    const { ciphertext, kid } = await enc.encryptForTenant(tenantA, plaintext);
    const decrypted = await enc.decryptForTenant(tenantA, ciphertext, kid);

    expect(decrypted).toBe(plaintext);
  });

  it('ciphertext difere entre execuções (nonce random)', async () => {
    const provider = new LocalKmsProvider(buildEnvService());
    const enc = new EncryptionService(provider);

    const a = await enc.encryptForTenant(tenantA, 'same@input.com');
    const b = await enc.encryptForTenant(tenantA, 'same@input.com');
    expect(a.ciphertext.equals(b.ciphertext)).toBe(false);
  });

  it('tampering no ciphertext invalida o auth tag (decrypt throws)', async () => {
    const provider = new LocalKmsProvider(buildEnvService());
    const enc = new EncryptionService(provider);

    const { ciphertext, kid } = await enc.encryptForTenant(tenantA, 'secret');
    const tampered = Buffer.from(ciphertext);
    tampered[20] = (tampered[20] ?? 0) ^ 0xff; // flip um bit no meio (sob noUncheckedIndexedAccess)

    await expect(enc.decryptForTenant(tenantA, tampered, kid)).rejects.toThrow();
  });

  it('decrypt com tenant errado falha (DEKs cross-tenant divergem)', async () => {
    const provider = new LocalKmsProvider(buildEnvService());
    const enc = new EncryptionService(provider);

    const { ciphertext, kid } = await enc.encryptForTenant(tenantA, 'secret');
    await expect(enc.decryptForTenant(tenantB, ciphertext, kid)).rejects.toThrow();
  });
});

describe('KmsHealthService', () => {
  it('ping ok quando provider responde com DEK válido', async () => {
    const provider = new LocalKmsProvider(buildEnvService());
    const health = new KmsHealthService(provider);
    await expect(health.ping()).resolves.toBeUndefined();
  });
});
