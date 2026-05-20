import { Buffer } from 'node:buffer';
import { hkdfSync } from 'node:crypto';

import type { TenantId } from '@mais-inclusao/contracts/shared';
import {
  AES_256_GCM_ALGORITHM,
  type KmsDerivedDek,
  type KmsDeriveDekInput,
  type KmsKeyId,
  type KmsProvider,
} from '@mais-inclusao/persistence';
import { Injectable } from '@nestjs/common';

import { EnvService } from '../shared/env/env.service.js';

/**
 * Provider local de KMS para Onda 1 (mode dev/test/prod-self-hosted).
 *
 * Lê uma master key (KEK) única da env `KMS_MASTER_KEY_BASE64` e
 * deriva DEKs determinísticos via HKDF-SHA256. Não há proteção contra
 * vazamento da master key (está em env var); para isolamento de raio
 * de explosão real, Onda 2 troca este provider por AWS KMS / Vault.
 *
 * Determinismo do HKDF: dada a mesma master_key + nonce + kid + purpose,
 * a saída é idêntica. Isso permite cifrar uma vez e decifrar depois
 * passando os mesmos inputs (recuperados da linha do banco).
 *
 * O `info` do HKDF concatena tenant_id + purpose + kid → contexto único
 * por (tenant, propósito, versão de chave). Tenants diferentes derivam
 * DEKs diferentes mesmo com mesmo nonce — defesa cross-tenant.
 */
@Injectable()
export class LocalKmsProvider implements KmsProvider {
  private readonly masterKey: Buffer;
  private readonly kid: KmsKeyId;

  public constructor(env: EnvService) {
    this.masterKey = Buffer.from(env.values.KMS_MASTER_KEY_BASE64, 'base64');
    this.kid = env.values.KMS_KID;
  }

  public currentKid(tenantId: TenantId): KmsKeyId {
    // Tenant-id-agnostic em Onda 1 (mesma KEK para todos os tenants).
    // Onda 2: AWS KMS / Vault retornará kid distinto por tenant.
    void tenantId;
    return this.kid;
  }

  public deriveDek(input: KmsDeriveDekInput): KmsDerivedDek {
    const kid = input.kid ?? this.kid;
    const info = Buffer.concat([
      Buffer.from(input.tenant_id, 'utf8'),
      Buffer.from('|', 'utf8'),
      Buffer.from(input.purpose ?? 'default', 'utf8'),
      Buffer.from('|', 'utf8'),
      Buffer.from(kid, 'utf8'),
    ]);

    // HKDF-SHA256 com salt = nonce per-row + info contextual
    const derived = hkdfSync('sha256', this.masterKey, input.nonce, info, 32);
    return {
      algorithm: AES_256_GCM_ALGORITHM,
      bytes: new Uint8Array(derived),
      kid,
    };
  }
}
