import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';

import { TenantIdSchema } from '@mais-inclusao/contracts/shared';
import type { KmsProvider } from '@mais-inclusao/persistence';
import { Inject, Injectable } from '@nestjs/common';

import { KMS_PROVIDER } from './kms.token.js';

/**
 * Sanity check do KMS — usado pelo /health/ready.
 *
 * Faz uma roundtrip mínima (derive DEK com nonce random) e verifica
 * que retorna 32 bytes (AES-256). Não cifra/decifra dados reais.
 *
 * Em prod, com AWS KMS / Vault, isso vira um network round-trip
 * detectando latência ou indisponibilidade do KMS antes do request
 * de domínio falhar (fail-closed).
 */
@Injectable()
export class KmsHealthService {
  private static readonly HEALTH_TENANT = TenantIdSchema.parse(
    '00000000-0000-4000-8000-000000000000',
  );

  public constructor(@Inject(KMS_PROVIDER) private readonly kms: KmsProvider) {}

  public async ping(): Promise<void> {
    const dek = await this.kms.deriveDek({
      tenant_id: KmsHealthService.HEALTH_TENANT,
      nonce: randomBytes(12),
      purpose: 'health-check',
    });
    if (dek.bytes.length !== 32) {
      throw new Error(`KMS health failed: expected 32-byte DEK, got ${String(dek.bytes.length)}`);
    }
    if (!Buffer.from(dek.bytes).some((byte) => byte !== 0)) {
      throw new Error('KMS health failed: DEK is all zeros (provider misconfigured?)');
    }
  }
}
