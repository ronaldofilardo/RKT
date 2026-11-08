import { LoginPayloadSchema } from '@/schemas/contracts';

export type ParsedLoginPayload =
  | { ok: true; data: { identifier: string; password: string } }
  | { ok: false; message: string; field: 'identifier' | 'password' };

export function parseLoginPayload(formData: FormData): ParsedLoginPayload {
  const raw = {
    identifier: ((formData.get('identifier') as string) || '').trim(),
    password: ((formData.get('password') as string) || '').trim(),
  };

  const parsed = LoginPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      ok: false,
      message: firstIssue?.message || 'Informe e-mail ou CPF e a senha.',
      field: String(firstIssue?.path?.[0] || '') === 'password' ? 'password' : 'identifier',
    };
  }

  return { ok: true, data: parsed.data as { identifier: string; password: string } };
}
