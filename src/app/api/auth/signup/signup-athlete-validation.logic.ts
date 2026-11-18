import { NextResponse } from 'next/server';
import { isMinor } from '@/core/access/age';

export function validateAthleteSignupAge(role: string, birthDateRaw?: string | null): NextResponse | null {
  if (!role.startsWith('ATLETA')) return null;
  if (!birthDateRaw) return null; // Permite autocadastro sem birthDate se não fornecido

  const birthDate = new Date(birthDateRaw);
  if (Number.isNaN(birthDate.getTime())) {
    return NextResponse.json(
      { error: 'INVALID_BIRTHDATE', message: 'Data de nascimento inválida.' },
      { status: 400 },
    );
  }

  if (isMinor(birthDate, new Date())) {
    return NextResponse.json(
      {
        error: 'MINOR_REQUIRES_GUARDIAN',
        message: 'Por determinação do ECA Digital (Lei nº 15.211/2025), atletas menores de 18 anos devem ser cadastrados pelo respectivo Responsável Legal.',
      },
      { status: 403 },
    );
  }

  return null;
}
