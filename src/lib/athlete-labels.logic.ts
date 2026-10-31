/**
 * Normalização/exibição de gênero, lateralidade, nascimento e idade de atletas.
 * O banco guarda strings livres e dois vocabulários coexistem:
 *  - canônico (match/new, /atletas): MALE | FEMALE, LEFT | RIGHT
 *  - legado (cadastro do gestor):    MASCULINO | FEMININO, DESTRO | CANHOTO | AMBIDEXTRO
 */
export type CanonicalGender = 'MALE' | 'FEMALE';
export type CanonicalDominance = 'LEFT' | 'RIGHT';

export function normalizeGender(value: string | null | undefined): CanonicalGender | undefined {
  const v = (value ?? '').trim().toUpperCase();
  if (v === 'MALE' || v === 'MASCULINO') return 'MALE';
  if (v === 'FEMALE' || v === 'FEMININO') return 'FEMALE';
  return undefined;
}

export function normalizeDominance(value: string | null | undefined): CanonicalDominance | undefined {
  const v = (value ?? '').trim().toUpperCase();
  if (v === 'RIGHT' || v === 'DESTRO') return 'RIGHT';
  if (v === 'LEFT' || v === 'CANHOTO') return 'LEFT';
  return undefined;
}

export function genderLabel(value: string | null | undefined): string {
  const g = normalizeGender(value);
  if (g === 'MALE') return 'Masculino';
  if (g === 'FEMALE') return 'Feminino';
  return '-';
}

/** 'YYYY-MM-DD' (ou ISO) -> 'DD/MM/YYYY', sem deslocamento de fuso. */
export function formatBirthDate(value: string | null | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

/**
 * Idade para exibição: prioriza a data de nascimento completa (idade real);
 * sem ela, usa a idade gravada (calculada pelo ano de nascimento).
 */
export function computeAthleteAge(
  birthDate: string | null | undefined,
  storedAge: number | null | undefined,
  today: Date = new Date(),
): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate ?? '');
  if (m) {
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    let age = today.getFullYear() - y;
    const beforeBirthday = today.getMonth() + 1 < mo || (today.getMonth() + 1 === mo && today.getDate() < d);
    if (beforeBirthday) age -= 1;
    return age >= 0 ? age : null;
  }
  return typeof storedAge === 'number' && storedAge >= 0 ? storedAge : null;
}
