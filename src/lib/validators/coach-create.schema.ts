import { z } from 'zod';
import { isValidCpf } from './cpf.validator';

export const CoachCreateSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
  cpf: z.string()
    .min(1, 'CPF é obrigatório')
    .refine((v) => isValidCpf(v), 'CPF inválido'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  email: z.string().email('E-mail inválido'),
});

export type CoachCreateInput = z.infer<typeof CoachCreateSchema>;
