import { createHmac } from 'node:crypto';

/**
 * HMAC-SHA256 retornando hex (64 chars).
 *
 * Usado para hashes determinísticos de busca em colunas com PII cifrada
 * (ADR-0006). Exemplo: `email_hash` permite encontrar um usuário por
 * email sem decifrar o `email_encrypted` de toda a tabela — basta
 * comparar HMAC-SHA256(email_normalized, GLOBAL_PEPPER).
 *
 * **CRÍTICO**: `pepper` deve ser global por instalação (não por tenant)
 * para permitir uniqueness check cross-tenant em CPFs nacionais; mas
 * NUNCA deve ser rotacionado sem migration massiva, pois reescreve
 * todos os hashes existentes.
 *
 * Por que HMAC e não SHA puro: HMAC adiciona o pepper como chave —
 * atacante com acesso ao DB e à coluna `email_hash` ainda precisa do
 * pepper (armazenado fora do banco) para fazer rainbow table.
 */
export const hmacSha256 = (value: string, pepper: Buffer): string =>
  createHmac('sha256', pepper).update(value).digest('hex');
