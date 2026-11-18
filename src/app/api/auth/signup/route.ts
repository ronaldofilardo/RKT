import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cleanCpf, isValidCpf } from '@/core/athlete/cpf';
import { GuardianProfileSchema } from '@/schemas/guardian';
import { signupPost, type SignupInput } from './signup-post.logic';

const SignupSchema = z.object({
  name: z.string().min(2).max(120),
  identifier: z.string().min(3).max(120),
  password: z.string().min(8).max(128),
  role: z.enum(['ATLETA', 'TREINADOR', 'ESPECTADOR', 'GESTOR', 'RESPONSAVEL']),
  cpf: z.string().optional(),
  birthDate: z.string().optional(),
  guardianProfile: GuardianProfileSchema.optional(),
});

function validateInput(body: unknown): { ok: true; data: SignupInput } | { ok: false; response: NextResponse } {
  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    const firstErr = parsed.error.errors[0]?.message || 'Dados cadastrais inválidos';
    const fieldMap: Record<string, string> = {};
    for (const err of parsed.error.errors) {
      const p = err.path.join('.');
      if (p && !fieldMap[p]) fieldMap[p] = err.message;
    }
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'VALIDATION_ERROR', message: firstErr, fields: fieldMap, details: parsed.error.flatten() },
        { status: 400 },
      ),
    };
  }
  const { name, identifier, password, role, cpf, birthDate, guardianProfile } = parsed.data;
  if (role === 'RESPONSAVEL' && !guardianProfile) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Informe os dados do menor dependente.' },
        { status: 400 },
      ),
    };
  }
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

  return {
    ok: true,
    data: { name, identifier: trimmed, password, role, cpf: cpfValue ?? null, birthDate, guardianProfile },
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const validation = validateInput(body);
  if (!validation.ok) return validation.response;

  const ipHash = Buffer.from(request.headers.get('x-forwarded-for') || 'local').toString('base64');
  const req = new NextRequest(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validation.data),
  });
  return signupPost(req as unknown as Request, ipHash);
}
