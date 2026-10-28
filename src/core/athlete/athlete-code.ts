import { randomInt } from 'crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Gera codigo curto do atleta usando CSPRNG (substitui Math.random). */
export function generateAthleteCode(length = 8): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return code;
}

/** Gera codigo nao-colidido: tenta ate maxAttempts enquanto isTaken retornar true. */
export async function generateUniqueAthleteCode(
  isTaken: (code: string) => boolean | Promise<boolean>,
  { length = 8, maxAttempts = 10 }: { length?: number; maxAttempts?: number } = {},
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateAthleteCode(length);
    if (!(await isTaken(code))) return code;
  }
  throw new Error(`Nao foi possivel gerar athleteCode unico apos ${maxAttempts} tentativas`);
}

export function isValidAthleteCode(code: string): boolean {
  return code.length === 8 && [...code].every((c) => ALPHABET.includes(c));
}
