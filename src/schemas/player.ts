import { z } from "zod";
import { flexibleIdValidator } from "./common";
import { isValidCpf } from "@/core/athlete/cpf";
import { BRAZILIAN_UFS } from "@/core/athlete/brazilian-states";
import { NICKNAME_MAX, NICKNAME_MIN, normalizeNickname, validateNickname } from "@/core/athlete/nickname";

/** Apelido público: normalizado em minúsculas e validado pelas regras de core. */
export const NicknameSchema = z
  .string()
  .transform((value) => normalizeNickname(value))
  .refine((value) => validateNickname(value).valid, {
    message: `Apelido deve ter ${NICKNAME_MIN}-${NICKNAME_MAX} caracteres e usar apenas letras, números, ponto, hífen ou sublinhado`,
  });

export const RankingEntrySchema = z.object({
  category: z.string().optional(),
  class: z.string().optional(),
  position: z.number().int().min(1),
  juvenilePosition: z.number().int().min(1).optional(),
});
export type RankingEntry = z.infer<typeof RankingEntrySchema>;

export const RankingTypeSchema = z.enum(['ESTADUAL', 'CBT', 'COSAT', 'ITF', 'ITF_Juniors', 'ATP', 'WTA']);
export type RankingType = z.infer<typeof RankingTypeSchema>;

export const RankingsSchema = z.record(RankingTypeSchema, RankingEntrySchema);
export type Rankings = z.infer<typeof RankingsSchema>;

export const PlayerSchema = z.object({
  id: flexibleIdValidator,
  name: z.string().min(2).max(100),
  club: z.string().optional(),
  nickname: z.string().nullable().optional(),
});
export type Player = z.infer<typeof PlayerSchema>;

export const CreatePlayerInputSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  age: z.number().min(1).max(120).optional(),
  birthDate: z.coerce.date().optional(),
  birthYear: z.number().min(1900).max(2100).optional(),
  dominance: z.enum(['LEFT', 'RIGHT']).optional(),
  backhand: z.enum(['ONE_HANDED', 'TWO_HANDED']).optional(),
  rankings: z.record(
    z.enum(['ESTADUAL', 'CBT', 'COSAT', 'ITF', 'ITF_Juniors', 'ATP', 'WTA']),
    z.object({
      position: z.number().min(1),
      category: z.string().optional(),
      class: z.string().optional(),
      juvenilePosition: z.number().min(1).optional(),
    })
  ).optional(),
  club: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.enum(BRAZILIAN_UFS).optional(),
  isExternalClub: z.boolean().optional().default(false),
  cpf: z.string().optional().refine(
    (cpf) => !cpf || isValidCpf(cpf),
    { message: 'CPF inválido' },
  ),
  myClub: z.boolean().optional().default(false),
  ctId: z.string().optional(),
  createdByUserId: z.string().optional(),
  nickname: NicknameSchema.optional(),
  poolVisible: z.boolean().optional(),
});
export type CreatePlayerInput = z.infer<typeof CreatePlayerInputSchema>;

export const UpdatePlayerInputSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório (mín 2 chars)').optional(),
  gender: z.enum(['MALE', 'FEMALE']).nullish(),
  birthDate: z.coerce.date({ errorMap: () => ({ message: 'Data de nascimento inválida' }) }).nullish(),
  dominance: z.enum(['LEFT', 'RIGHT']).nullish(),
  backhand: z.enum(['ONE_HANDED', 'TWO_HANDED']).nullish(),
  rankings: RankingsSchema.nullish(),
  club: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.enum(BRAZILIAN_UFS).optional(),
  isExternalClub: z.boolean().optional(),
  nickname: NicknameSchema.nullish(),
});
export type UpdatePlayerInput = z.infer<typeof UpdatePlayerInputSchema>;

export const ListPlayersInputSchema = z.object({
  userId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListPlayersInput = z.infer<typeof ListPlayersInputSchema>;
