import { Buffer } from 'node:buffer';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import type { TenantId } from '@mais-inclusao/contracts/shared';
import type { KmsProvider } from '@mais-inclusao/persistence';
import { Inject, Injectable } from '@nestjs/common';

import { KMS_PROVIDER } from './kms.token.js';

const NONCE_BYTES = 12;
const AUTH_TAG_BYTES = 16;

export interface EncryptResult {
  /** Buffer composto: nonce(12) || ciphertext || authTag(16). */
  readonly ciphertext: Buffer;
  /** kid usado na derivação do DEK (precisa ser guardado na linha). */
  readonly kid: string;
}

/**
 * Service de cifragem AES-256-GCM por tenant.
 *
 * Cifragem: gera nonce random per-row → deriva DEK via KMS → cifra plaintext
 * → concatena nonce(12) || ciphertext || authTag(16) em um único Buffer
 * que vai pra coluna `email_encrypted` (Bytes no Prisma).
 *
 * Decifragem: extrai nonce/ciphertext/authTag do buffer → deriva DEK
 * (mesmo nonce + kid armazenado) → decifra. AES-GCM verifica o authTag
 * automaticamente; se foi tamperado, decrypt() throws.
 */
@Injectable()
export class EncryptionService {
  public constructor(@Inject(KMS_PROVIDER) private readonly kms: KmsProvider) {}

  public async encryptForTenant(tenantId: TenantId, plaintext: string): Promise<EncryptResult> {
    const nonce = randomBytes(NONCE_BYTES);
    const dek = await this.kms.deriveDek({ tenant_id: tenantId, nonce });

    const cipher = createCipheriv('aes-256-gcm', Buffer.from(dek.bytes), nonce);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: Buffer.concat([nonce, encrypted, authTag]),
      kid: dek.kid,
    };
  }

  public async decryptForTenant(
    tenantId: TenantId,
    buffer: Buffer,
    kid: string,
  ): Promise<string> {
    if (buffer.length < NONCE_BYTES + AUTH_TAG_BYTES) {
      throw new Error('Ciphertext too short — possible corruption.');
    }
    const nonce = buffer.subarray(0, NONCE_BYTES);
    const authTag = buffer.subarray(buffer.length - AUTH_TAG_BYTES);
    const ciphertext = buffer.subarray(NONCE_BYTES, buffer.length - AUTH_TAG_BYTES);

    const dek = await this.kms.deriveDek({ tenant_id: tenantId, nonce, kid });
    const decipher = createDecipheriv('aes-256-gcm', Buffer.from(dek.bytes), nonce);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  }
}
