import { z } from "zod";
import { flexibleIdValidator } from "./common";

export const RoleSchema = z.enum([
  "ADMIN",
  "ANNOTATOR",
]);
export type Role = z.infer<typeof RoleSchema>;

export const UserSchema = z.object({
  id: flexibleIdValidator,
  name: z.string().min(2).max(100),
  email: z.string().email(),
  cpf: z.string(),
  role: RoleSchema,
  club: z.string().nullish(),
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date().optional(),
});
export type User = z.infer<typeof UserSchema>;

export const CreateUserInputSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  cpf: z.string().min(11, 'CPF deve ter pelo menos 11 dígitos'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: RoleSchema,
  club: z.string().optional(),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export const ListUsersInputSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: RoleSchema.optional(),
});
export type ListUsersInput = z.infer<typeof ListUsersInputSchema>;

export const LoginPayloadSchema = z
  .object({
    identifier: z.string().min(3, 'Informe seu e-mail ou CPF').optional(),
    email: z.string().optional(),
    password: z.string().min(1, 'Informe a senha'),
  })
  .refine((data) => Boolean(data.identifier || data.email), {
    message: 'Informe seu e-mail ou CPF',
    path: ['identifier'],
  });
export type LoginPayload = z.infer<typeof LoginPayloadSchema>;
