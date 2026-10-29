import crypto from 'node:crypto';

/**
 * Utilitários criptográficos para links de convite de acompanhamento.
 * R-03: <= 100 linhas.
 */

export interface GeneratedToken {
  token: string;
  tokenHash: string;
}

/**
 * Gera um token aleatório criptograficamente seguro de 32 bytes (base64url)
 * e seu respectivo hash SHA-256 para armazenamento no banco de dados.
 */
export function generateSpectateToken(): GeneratedToken {
  const bytes = crypto.randomBytes(32);
  const token = bytes.toString('base64url');
  const tokenHash = hashSpectateToken(token);
  return { token, tokenHash };
}

/**
 * Calcula o hash SHA-256 em formato hexadecimal de um token recebido.
 */
export function hashSpectateToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

