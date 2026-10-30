import { z } from 'zod';
import { isValidCnpj } from './cnpj.validator';
import { isValidCpf } from './cpf.validator';

export const GestorSignupSchema = z.object({
  // Dados da PJ
  cnpj: z.string()
    .min(1, 'CNPJ é obrigatório')
    .refine((v) => isValidCnpj(v), 'CNPJ inválido'),
  razaoSocial: z.string().min(2, 'Razão Social deve ter pelo menos 2 caracteres').max(120),
  nomeFantasia: z.string().min(2, 'Nome Fantasia deve ter pelo menos 2 caracteres').max(120),
  telefone: z.string().min(8, 'Telefone inválido'),
  email: z.string().email('E-mail institucional inválido'),
  endereco: z.object({
    rua: z.string().optional(),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().length(2).optional(),
    cep: z.string().optional(),
  }).optional(),
  // Dados do Representante Legal
  legalRepName: z.string().min(2, 'Nome do representante legal é obrigatório').max(120),
  legalRepCpf: z.string()
    .min(1, 'CPF do representante legal é obrigatório')
    .refine((v) => isValidCpf(v), 'CPF do representante legal inválido'),
  legalRepEmail: z.string().email('E-mail do representante legal inválido'),
  legalRepPhone: z.string().min(8, 'Telefone do representante legal inválido'),
  // Dados do Responsável pelo Sistema (Passo 2)
  sameAsLegalRep: z.boolean().default(false),
  responsibleName: z.string().min(2, 'Nome do responsável é obrigatório').max(120).optional(),
  responsibleCpf: z.string()
    .min(1, 'CPF do responsável é obrigatório')
    .refine((v) => isValidCpf(v), 'CPF do responsável inválido')
    .optional(),
  responsibleEmail: z.string().email('E-mail do responsável inválido').optional(),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
});

export type GestorSignupInput = z.infer<typeof GestorSignupSchema>;
