import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cleanCpf, isValidCpf } from '@/core/athlete/cpf';
import { signupPost, type SignupInput } from './signup-post.logic';

const SignupSchema = z.object({
  name: z.string().min(2).max(120),
  identifier: z.string().min(3).max(120),
  password: z.string().min(8).max(128),
  role: z.enum(['ATLETA', 'TREINADOR', 'ESPECTADOR', 'GESTOR']),
  cpf: z.string().optional(),
  birthDate: z.string().optional(),
});

function validateInput(body: unknown): { ok: true; data: SignupInput } | { ok: false; response: NextResponse } {
  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, response: NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 }) };
  }
  const { name, identifier, password, role, cpf, birthDate } = parsed.data;
  const trimmed = identifier.trim();
  const isEmail = trimmed.includes('@');

  let cpfValue: string | undefined;
  if (isEmail) {
    if (cpf) {
      if (!isValidCpf(cpf)) {
        return { ok: false, response: NextResponse.json({ error: 'VALIDATION_ERROR', message: 'CPF inválido' }, { status: 400 }) };
      }
      cpfValue = cleanCpf(cpf);
    }
  } else {
    if (!isValidCpf(trimmed)) {
      return { ok: false, response: NextResponse.json({ error: 'VALIDATION_ERROR', message: 'CPF inválido' }, { status: 400 }) };
    }
    cpfValue = cleanCpf(trimmed);
  }

  return { ok: true, data: { name, identifier: trimmed, password, role, cpf: cpfValue ?? null, birthDate } };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const validation = validateInput(body);
  if (!validation.ok) return validation.response;

  const req = new NextRequest(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validation.data),
  });
  return signupPost(req as unknown as Request);
}
