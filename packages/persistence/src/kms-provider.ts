import type { TenantId } from '@mais-inclusao/contracts/shared';

/**
 * Algoritmo de cifragem padronizado para colunas com PII (ADR-0006).
 *
 * AEAD com autenticação integrada (auth tag) previne tampering silencioso —
 * tentativa de modificar ciphertext sem a chave correta falha no decrypt.
 */
export const AES_256_GCM_ALGORITHM = 'AES-256-GCM';

export type Aes256GcmAlgorithm = typeof AES_256_GCM_ALGORITHM;

/**
 * Identificador opaco da chave KMS (versão / kid).
 *
 * Cada linha cifrada guarda o `kid` que originou seu DEK, permitindo
 * rotação de KEK sem migration massiva — DEKs antigas continuam
 * decifráveis enquanto a KEK correspondente existir no KMS.
 */
export type KmsKeyId = string;

export interface KmsDeriveDekInput {
  readonly tenant_id: TenantId;
  /**
   * Nonce per-row (12+ bytes). Funciona como salt do HKDF que deriva o DEK
   * a partir da KEK do tenant. NUNCA reutilizar nonce com a mesma KEK.
   */
  readonly nonce: Uint8Array;
  /** kid opcional para decifrar linhas antigas (rotação) — padrão usa kid corrente. */
  readonly kid?: KmsKeyId;
  /**
   * Domínio do DEK (ex: 'auth.email', 'citizens.cpf'). Permite múltiplos DEKs
   * por (tenant, nonce, kid) — derivação determinística por propósito.
   */
  readonly purpose?: string;
}

export interface KmsDerivedDek {
  readonly algorithm: Aes256GcmAlgorithm;
  /** 32 bytes para AES-256. */
  readonly bytes: Uint8Array;
  /** kid usado na derivação (necessário ao decifrar depois). */
  readonly kid: KmsKeyId;
}

/**
 * Contrato genérico para qualquer provider de KMS (local, AWS KMS,
 * HashiCorp Vault, GCP KMS). Onda 1 usa apenas `LocalKmsProvider`
 * (chave em env var); Onda 2 troca por implementação real sem mudar
 * o código que consome esta interface.
 *
 * ADR-0006: Criptografia de PII em coluna com KEK por tenant.
 */
export interface KmsProvider {
  /**
   * Retorna o kid corrente para um tenant. Implementações podem cachear
   * em memória ou consultar o KMS a cada chamada.
   */
  currentKid(tenantId: TenantId): KmsKeyId | Promise<KmsKeyId>;

  /**
   * Deriva um DEK (Data Encryption Key) determinístico a partir da KEK
   * do tenant, do nonce e do kid. Como é determinístico, decifrar requer
   * passar exatamente os mesmos inputs (nonce e kid armazenados na linha).
   */
  deriveDek(input: KmsDeriveDekInput): KmsDerivedDek | Promise<KmsDerivedDek>;
}
