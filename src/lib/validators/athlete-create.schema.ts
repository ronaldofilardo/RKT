import { z } from 'zod';
import { isValidCpf } from './cpf.validator';

export const AthleteCreateSchema = z.object({
  name: z.string().min(2, 'Nome completo deve ter pelo menos 2 caracteres').max(120),
  cpf: z.string()
    .min(1, 'CPF é obrigatório')
    .refine((v) => isValidCpf(v), 'CPF inválido'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  gender: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']),
  laterality: z.enum(['DESTRO', 'CANHOTO', 'AMBIDEXTRO']),
});

export type AthleteCreateInput = z.infer<typeof AthleteCreateSchema>;
