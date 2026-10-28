/**
 * Lógica de validação e estado do modal de onboarding de Gestor.
 */

import { isValidCnpj } from '@/lib/validators/cnpj.validator';
import { isValidCpf } from '@/lib/validators/cpf.validator';

export interface AddressForm {
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface GestorFormStep1 {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  telefone: string;
  email: string;
  endereco: AddressForm;
  legalRepName: string;
  legalRepCpf: string;
  legalRepEmail: string;
  legalRepPhone: string;
}

export interface GestorFormStep2 {
  sameAsLegalRep: boolean;
  name: string;
  cpf: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const initialStep1: GestorFormStep1 = {
  cnpj: '',
  razaoSocial: '',
  nomeFantasia: '',
  telefone: '',
  email: '',
  endereco: { rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' },
  legalRepName: '',
  legalRepCpf: '',
  legalRepEmail: '',
  legalRepPhone: '',
};

export const initialStep2: GestorFormStep2 = {
  sameAsLegalRep: false,
  name: '',
  cpf: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export function validateStep1(form: GestorFormStep1): string | null {
  if (!isValidCnpj(form.cnpj)) return 'CNPJ inválido';
  if (!form.razaoSocial.trim()) return 'Razão Social é obrigatória';
  if (!form.nomeFantasia.trim()) return 'Nome Fantasia é obrigatório';
  if (!form.telefone.trim()) return 'Telefone é obrigatório';
  if (!form.email.trim()) return 'E-mail é obrigatório';
  if (!form.endereco.rua.trim()) return 'Rua é obrigatória';
  if (!form.endereco.numero.trim()) return 'Número é obrigatório';
  if (!form.endereco.bairro.trim()) return 'Bairro é obrigatório';
  if (!form.endereco.cidade.trim()) return 'Cidade é obrigatória';
  if (!form.endereco.estado.trim()) return 'Estado é obrigatório';
  if (!form.endereco.cep.trim()) return 'CEP é obrigatório';
  if (!isValidCpf(form.legalRepCpf)) return 'CPF do representante legal inválido';
  if (!form.legalRepName.trim()) return 'Nome do representante legal é obrigatório';
  if (!form.legalRepEmail.trim()) return 'E-mail do representante legal é obrigatório';
  if (!form.legalRepPhone.trim()) return 'Telefone do representante legal é obrigatório';
  return null;
}

export function validateStep2(step2: GestorFormStep2): string | null {
  const { sameAsLegalRep, name, cpf, email, password, confirmPassword } = step2;
  if (!sameAsLegalRep) {
    if (!name.trim()) return 'Nome do responsável é obrigatório';
    if (!isValidCpf(cpf)) return 'CPF do responsável inválido';
    if (!email.trim()) return 'E-mail do responsável é obrigatório';
  }
  if (!password.trim()) return 'Senha é obrigatória';
  if (password.length < 8) return 'Senha deve ter pelo menos 8 caracteres';
  if (password !== confirmPassword) return 'Senhas não conferem';
  return null;
}
