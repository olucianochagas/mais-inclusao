import { TenantIdSchema } from '@mais-inclusao/contracts/shared';
import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  AES_256_GCM_ALGORITHM,
  type KmsDerivedDek,
  type KmsDeriveDekInput,
  type KmsKeyId,
  type KmsProvider,
} from '../src/kms-provider.js';

describe('KmsProvider contract (types-only)', () => {
  it('AES_256_GCM_ALGORITHM constante "AES-256-GCM"', () => {
    expect(AES_256_GCM_ALGORITHM).toBe('AES-256-GCM');
    expectTypeOf<typeof AES_256_GCM_ALGORITHM>().toEqualTypeOf<'AES-256-GCM'>();
  });

  it('KmsKeyId é string opaca', () => {
    const kid: KmsKeyId = 'auth-2026-05-key1';
    expect(typeof kid).toBe('string');
  });

  it('KmsDeriveDekInput aceita tenant_id branded + nonce + optional kid/purpose', () => {
    const tenant_id = TenantIdSchema.parse('550e8400-e29b-41d4-a716-446655440000');
    const input: KmsDeriveDekInput = {
      tenant_id,
      nonce: new Uint8Array(12),
      purpose: 'auth.email',
    };
    expect(input.tenant_id).toBe(tenant_id);
  });

  it('KmsProvider implementação stub satisfaz contrato', async () => {
    const stub: KmsProvider = {
      currentKid: (): KmsKeyId => 'stub-kid-1',
      deriveDek: (input: KmsDeriveDekInput): KmsDerivedDek => ({
        algorithm: AES_256_GCM_ALGORITHM,
        bytes: new Uint8Array(32),
        kid: input.kid ?? 'stub-kid-1',
      }),
    };
    const kid = await stub.currentKid(
      TenantIdSchema.parse('550e8400-e29b-41d4-a716-446655440000'),
    );
    expect(kid).toBe('stub-kid-1');

    const dek = await stub.deriveDek({
      tenant_id: TenantIdSchema.parse('550e8400-e29b-41d4-a716-446655440000'),
      nonce: new Uint8Array(12),
    });
    expect(dek.algorithm).toBe('AES-256-GCM');
    expect(dek.bytes).toHaveLength(32);
  });
});
