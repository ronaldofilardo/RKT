import { z } from "zod";
import { flexibleIdValidator } from "./common";

export const MAX_COMMENT_CONTENT_LENGTH = 500;

export const CreateCommentInputSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Conteúdo do comentário é obrigatório")
    .max(
      MAX_COMMENT_CONTENT_LENGTH,
      `Comentário deve ter no máximo ${MAX_COMMENT_CONTENT_LENGTH} caracteres`,
    ),
  category: z.string().trim().max(100).nullish(),
  pointId: flexibleIdValidator.nullish(),
});
export type CreateCommentInput = z.infer<typeof CreateCommentInputSchema>;

export const UpdateCommentInputSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1, "Conteúdo do comentário é obrigatório")
      .max(
        MAX_COMMENT_CONTENT_LENGTH,
        `Comentário deve ter no máximo ${MAX_COMMENT_CONTENT_LENGTH} caracteres`,
      )
      .optional(),
    category: z.string().trim().max(100).nullish(),
  })
  .refine(
    (body) => body.content !== undefined || body.category !== undefined,
    "Informe content ou category para atualizar",
  );
export type UpdateCommentInput = z.infer<typeof UpdateCommentInputSchema>;

export const SessionPathParamsSchema = z.object({
  id: z.string().trim().min(1),
  sessionId: z.string().trim().min(1),
});
export type SessionPathParams = z.infer<typeof SessionPathParamsSchema>;
