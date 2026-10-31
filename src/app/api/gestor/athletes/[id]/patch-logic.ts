import { z } from 'zod';
import { normalizeDominance, normalizeGender } from '@/lib/athlete-labels.logic';

// Aceita os dois vocabulários (MALE/FEMALE e MASCULINO/FEMININO; LEFT/RIGHT e
// DESTRO/CANHOTO) e grava sempre o canônico (MALE/FEMALE, LEFT/RIGHT).
export const PatchSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
  // Obrigatório (11 dígitos) só para atleta com conta de acesso; a rota valida isso.
  cpf: z
    .string()
    .default('')
    .refine((v) => v === '' || v.replace(/\D/g, '').length >= 11, 'CPF inválido'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  gender: z
    .string()
    .transform((v, ctx) => {
      const g = normalizeGender(v);
      if (!g) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Gênero deve ser 'Masculino' ou 'Feminino'" });
        return z.NEVER;
      }
      return g;
    }),
  dominance: z
    .string()
    .transform((v, ctx) => {
      const d = normalizeDominance(v);
      if (!d) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Lateralidade deve ser 'Destro' ou 'Canhoto'" });
        return z.NEVER;
      }
      return d;
    }),
});
