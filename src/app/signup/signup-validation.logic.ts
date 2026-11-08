import { isValidCpf } from '@/lib/validators/cpf.validator';

export type SignupField = 'name' | 'identifier' | 'password';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Nome completo: ao menos duas palavras e sem dígitos. */
export function validateFullName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Informe seu nome completo';
  if (/\d/.test(trimmed)) return 'O nome não pode conter números';
  if (trimmed.split(/\s+/).filter(Boolean).length < 2) return 'Informe nome e sobrenome';
  return null;
}

export function isEmailIdentifier(value: string): boolean {
  return value.includes('@') || /[a-zA-Z]/.test(value);
}

/** Aplica máscara progressiva de CPF enquanto o usuário digita. */
export function formatCpfInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Mantém texto de e-mail intacto e aplica máscara apenas em entradas numéricas de CPF. */
export function formatIdentifierInput(value: string): string {
  return /^[\d.-]*$/.test(value) ? formatCpfInput(value) : value;
}

/** Valida o identificador híbrido: e-mail quando contém letras/"@", CPF caso contrário. */
export function validateIdentifier(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Informe seu e-mail ou CPF';

  if (isEmailIdentifier(trimmed)) {
    return EMAIL_PATTERN.test(trimmed) ? null : 'Informe um e-mail válido';
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 11) return `CPF incompleto (faltam ${11 - digits.length} dígitos)`;
  if (digits.length > 11 || !isValidCpf(digits)) return 'CPF inválido. Confira os dígitos digitados.';
  return null;
}

export function validatePassword(value: string): string | null {
  return value.length >= 8 ? null : 'A senha deve ter no mínimo 8 caracteres';
}

export function validateSignupField(field: SignupField, value: string): string | null {
  if (field === 'name') return validateFullName(value);
  if (field === 'identifier') return validateIdentifier(value);
  return validatePassword(value);
}
