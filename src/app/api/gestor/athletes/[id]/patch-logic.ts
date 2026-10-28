import { z } from 'zod';

export const PatchSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
  cpf: z.string().min(11, 'CPF inválido'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  gender: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']),
  dominance: z.enum(['DESTRO', 'CANHOTO', 'AMBIDEXTRO']),
});
