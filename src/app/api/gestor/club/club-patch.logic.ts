import { z } from 'zod';

export const ClubPatchSchema = z.object({
  name: z.string().min(2, 'Nome fantasia deve ter pelo menos 2 caracteres').max(120).optional(),
  razaoSocial: z.string().min(2, 'Razão Social deve ter pelo menos 2 caracteres').max(120).optional(),
  telefone: z.string().min(8, 'Telefone institucional inválido').optional(),
  email: z.string().email('E-mail institucional inválido').optional(),
  legalRepName: z.string().min(2, 'Nome do representante legal é obrigatório').max(120).optional(),
  legalRepEmail: z.string().email('E-mail do representante legal inválido').optional(),
  legalRepPhone: z.string().min(8, 'Telefone do representante legal inválido').optional(),
});

export type ClubPatchInput = z.infer<typeof ClubPatchSchema>;

export function mapClubPatchData(input: ClubPatchInput) {
  const data: Record<string, string> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.razaoSocial !== undefined) data.legalName = input.razaoSocial;
  if (input.telefone !== undefined) data.phone = input.telefone;
  if (input.email !== undefined) data.email = input.email;
  if (input.legalRepName !== undefined) data.legalRepName = input.legalRepName;
  if (input.legalRepEmail !== undefined) data.legalRepEmail = input.legalRepEmail;
  if (input.legalRepPhone !== undefined) data.legalRepPhone = input.legalRepPhone;
  return data;
}

