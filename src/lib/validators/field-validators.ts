/**
 * Validadores puros para componentes de formulário (retornam mensagem ou null).
 */

import { validateCnpj } from './cnpj.validator';
import { validateCpf } from './cpf.validator';
import { validatePhone } from './phone.validator';
import { validateEmail } from './email.validator';
import { validateCep } from './cep.validator';
import { validateUf } from './uf.validator';

export function validateCnpjField(val: string): string | null {
  if (!val || !val.trim()) return 'CNPJ é obrigatório';
  const res = validateCnpj(val);
  return res.isValid ? null : res.message || 'CNPJ inválido';
}

export function validateCpfField(val: string): string | null {
  if (!val || !val.trim()) return 'CPF é obrigatório';
  const res = validateCpf(val);
  return res.isValid ? null : res.message || 'CPF inválido';
}

export function validatePhoneField(val: string): string | null {
  if (!val || !val.trim()) return 'Telefone é obrigatório';
  const res = validatePhone(val);
  return res.isValid ? null : res.message || 'Telefone inválido';
}

export function validateEmailField(val: string): string | null {
  if (!val || !val.trim()) return 'E-mail é obrigatório';
  const res = validateEmail(val);
  return res.isValid ? null : res.message || 'E-mail inválido';
}

export function validateCepField(val: string): string | null {
  if (!val || !val.trim()) return 'CEP é obrigatório';
  const res = validateCep(val);
  return res.isValid ? null : res.message || 'CEP inválido';
}

export function validateUfField(val: string): string | null {
  if (!val || !val.trim()) return 'UF é obrigatória';
  const res = validateUf(val);
  return res.isValid ? null : res.message || 'UF inválida';
}

