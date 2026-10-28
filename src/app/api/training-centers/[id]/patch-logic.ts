import { z } from 'zod';

export const StatusSchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED']),
});

export const ClubDataSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
  slug: z.string().min(2, 'Slug deve ter pelo menos 2 caracteres').max(60),
  razaoSocial: z.string().min(2, 'Razão Social deve ter pelo menos 2 caracteres').max(120),
  telefone: z.string().min(8, 'Telefone inválido'),
  email: z.string().email('E-mail institucional inválido'),
  address: z.object({
    rua: z.string().min(1),
    numero: z.string().min(1),
    complemento: z.string().optional(),
    bairro: z.string().min(1),
    cidade: z.string().min(1),
    estado: z.string().length(2),
    cep: z.string().min(1),
  }),
  legalRepName: z.string().min(2, 'Nome do representante legal é obrigatório').max(120),
  legalRepEmail: z.string().email('E-mail do representante legal inválido'),
  legalRepPhone: z.string().min(8, 'Telefone do representante legal inválido'),
});

export async function parseClubPatchBody(body: any) {
  const statusParsed = StatusSchema.safeParse(body);
  if (statusParsed.success) {
    return { type: 'status', data: statusParsed.data };
  }

  const dataParsed = ClubDataSchema.safeParse(body);
  if (!dataParsed.success) {
    return { type: 'error', error: dataParsed.error };
  }
  return { type: 'club', data: dataParsed.data };
}
