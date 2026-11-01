import { z } from 'zod';
import { isValidCnpj } from './cnpj.validator';
import { isValidCpf } from './cpf.validator';
import { isValidPhone } from './phone.validator';
import { isValidEmail } from './email.validator';
import { isValidCep } from './cep.validator';
import { isValidUf } from './uf.validator';

export const GestorSignupSchema = z.object({
  // Dados da PJ
  cnpj: z.string()
    .min(1, 'CNPJ é obrigatório')
    .refine((v) => isValidCnpj(v), 'CNPJ inválido'),
  razaoSocial: z.string().trim().min(2, 'Razão Social deve ter pelo menos 2 caracteres').max(120),
  nomeFantasia: z.string().trim().min(2, 'Nome Fantasia deve ter pelo menos 2 caracteres').max(120),
  telefone: z.string().refine((v) => isValidPhone(v), 'Telefone institucional inválido'),
  email: z.string().trim().toLowerCase().refine((v) => isValidEmail(v), 'E-mail institucional inválido'),
  endereco: z.object({
    rua: z.string().trim().min(1, 'Rua é obrigatória'),
    numero: z.string().trim().min(1, 'Número é obrigatório'),
    complemento: z.string().default(''),
    bairro: z.string().trim().min(1, 'Bairro é obrigatório'),
    cidade: z.string().trim().min(1, 'Cidade é obrigatória'),
    estado: z.string().trim().toUpperCase().refine((v) => isValidUf(v), 'UF inválida'),
    cep: z.string().refine((v) => isValidCep(v), 'CEP inválido'),
  }).optional(),
  // Dados do Representante Legal
  legalRepName: z.string().trim().min(2, 'Nome do representante legal é obrigatório').max(120),
  legalRepCpf: z.string()
    .min(1, 'CPF do representante legal é obrigatório')
    .refine((v) => isValidCpf(v), 'CPF do representante legal inválido'),
  legalRepEmail: z.string().trim().toLowerCase().refine((v) => isValidEmail(v), 'E-mail do representante legal inválido'),
  legalRepPhone: z.string().refine((v) => isValidPhone(v), 'Telefone do representante legal inválido'),
  // Dados do Responsável pelo Sistema (Passo 2)
  sameAsLegalRep: z.boolean().default(false),
  responsibleName: z.string().trim().max(120).optional(),
  responsibleCpf: z.string().optional(),
  responsibleEmail: z.string().trim().toLowerCase().optional(),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(72, 'Senha deve ter no máximo 72 caracteres'),
}).superRefine((data, ctx) => {
  if (!data.sameAsLegalRep) {
    if (!data.responsibleName || data.responsibleName.trim().length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['responsibleName'], message: 'Nome do responsável é obrigatório' });
    }
    if (!data.responsibleCpf || !isValidCpf(data.responsibleCpf)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['responsibleCpf'], message: 'CPF do responsável inválido' });
    }
    if (!data.responsibleEmail || !isValidEmail(data.responsibleEmail)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['responsibleEmail'], message: 'E-mail do responsável inválido' });
    }
  }
});

export type GestorSignupInput = z.infer<typeof GestorSignupSchema>;
