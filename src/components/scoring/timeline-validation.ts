import { z } from 'zod';
import {
  RallyDetailsSchema,
  RallySituacaoSchema,
  RallyTipoSchema,
  RallyGolpeSchema,
  RallyEfeitoSchema,
  RallyDirecaoSchema,
  RallyGolpeEspSchema,
} from '@/schemas/contracts';

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };

export function validateRallyDetails(data: unknown): ValidationResult<z.infer<typeof RallyDetailsSchema>> {
  const result = RallyDetailsSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.') || 'root';
    errors[path] = issue.message;
  }
  return { success: false, errors };
}

export function validateSituacao(value: unknown): ValidationResult<z.infer<typeof RallySituacaoSchema>> {
  return safeEnumValidate(RallySituacaoSchema, value, 'situacao');
}

export function validateTipo(value: unknown): ValidationResult<z.infer<typeof RallyTipoSchema>> {
  return safeEnumValidate(RallyTipoSchema, value, 'tipo');
}

export function validateGolpe(value: unknown): ValidationResult<z.infer<typeof RallyGolpeSchema>> {
  return safeEnumValidate(RallyGolpeSchema, value, 'golpe');
}

export function validateEfeito(value: unknown): ValidationResult<z.infer<typeof RallyEfeitoSchema>> {
  return safeEnumValidate(RallyEfeitoSchema, value, 'efeito');
}

export function validateDirecao(value: unknown): ValidationResult<z.infer<typeof RallyDirecaoSchema>> {
  return safeEnumValidate(RallyDirecaoSchema, value, 'direcao');
}

export function validateGolpeEsp(value: unknown): ValidationResult<z.infer<typeof RallyGolpeEspSchema>> {
  return safeEnumValidate(RallyGolpeEspSchema, value, 'golpe_esp');
}

function safeEnumValidate<T extends z.ZodTypeAny>(
  schema: T,
  value: unknown,
  fieldName: string,
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(value);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: { [fieldName]: result.error.issues[0]?.message ?? 'Invalid value' } };
}

export function isValidRallyDetails(data: unknown): data is z.infer<typeof RallyDetailsSchema> {
  return RallyDetailsSchema.safeParse(data).success;
}
