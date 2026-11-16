import { z } from 'zod';
import { isValidCpf } from './cpf.validator';
import { isMinor } from '@/core/access/age';

export const AthleteCreateSchema = z.object({
  name: z.string().min(2, 'Nome completo deve ter pelo menos 2 caracteres').max(120),
  cpf: z.string()
    .min(1, 'CPF é obrigatório')
    .refine((v) => isValidCpf(v), 'CPF inválido'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  gender: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']),
  laterality: z.enum(['DESTRO', 'CANHOTO', 'AMBIDEXTRO']),
  linkExisting: z.boolean().optional(),
  guardianName: z.string().optional(),
  guardianCpf: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianContact: z.string().optional(),
}).superRefine((data, ctx) => {
  const birth = new Date(data.birthDate);
  if (!Number.isNaN(birth.getTime()) && isMinor(birth, new Date())) {
    if (!data.guardianName || data.guardianName.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nome do responsável legal é obrigatório para atletas menores',
        path: ['guardianName'],
      });
    }
    if (!data.guardianCpf || !isValidCpf(data.guardianCpf)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CPF válido do responsável legal é obrigatório para atletas menores',
        path: ['guardianCpf'],
      });
    }
  }
});

export type AthleteCreateInput = z.infer<typeof AthleteCreateSchema>;
