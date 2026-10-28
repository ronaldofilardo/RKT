import { createHmac } from 'crypto';

/** Remove qualquer caractere que não seja dígito numérico. */
export function cleanCpf(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** Valida os 11 dígitos do CPF conforme cálculo dos dígitos verificadores (módulo 11). */
export function isValidCpf(raw: string): boolean {
  const digits = cleanCpf(raw);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  const d1 = remainder === 10 ? 0 : remainder;
  if (d1 !== Number(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  const d2 = remainder === 10 ? 0 : remainder;
  return d2 === Number(digits[10]);
}

/** Retorna os dois últimos dígitos do CPF. */
export function getCpfLast2(raw: string): string {
  const digits = cleanCpf(raw);
  return digits.slice(-2);
}

/** Mascara CPF para exibição segura: ***.***.**9-12 */
export function maskCpf(raw: string): string {
  const digits = cleanCpf(raw);
  if (digits.length < 2) return '***.***.***-**';
  const last2 = digits.slice(-2);
  const penultimo = digits.length >= 3 ? digits[digits.length - 3] : '*';
  return `***.***.**${penultimo}-${last2}`;
}

/** Gera hash HMAC-SHA256 determinístico usando o pepper secreto da plataforma. */
export function hashCpf(cpf: string, pepper: string): string {
  const normalized = cleanCpf(cpf);
  return createHmac('sha256', pepper).update(normalized).digest('hex');
}

