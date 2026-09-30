import { z } from "zod";
import { flexibleIdValidator } from "./common";

export const RankingEntrySchema = z.object({
  category: z.string().optional(),
  class: z.string().optional(),
  position: z.number().int().min(1),
  juvenilePosition: z.number().int().min(1).optional(),
});
export type RankingEntry = z.infer<typeof RankingEntrySchema>;

export const RankingsSchema = z.record(
  z.enum(['ESTADUAL', 'CBT', 'COSAT', 'ITF', 'ITF_Juniors', 'ATP', 'WTA']),
  RankingEntrySchema,
);
export type Rankings = z.infer<typeof RankingsSchema>;

export const PlayerSchema = z.object({
  id: flexibleIdValidator,
  name: z.string().min(2).max(100),
  club: z.string().optional(),
});
export type Player = z.infer<typeof PlayerSchema>;

export const CreatePlayerInputSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  age: z.number().min(1).max(120).optional(),
  birthDate: z.coerce.date().optional(),
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
  club: z.string().optional(),
  createdByUserId: z.string().optional(),
});
export type CreatePlayerInput = z.infer<typeof CreatePlayerInputSchema>;

export const ListPlayersInputSchema = z.object({
  userId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListPlayersInput = z.infer<typeof ListPlayersInputSchema>;
