/** Dados mínimos necessários para avaliar duplicidade de atleta (núcleo puro, sem I/O). */
export interface PlayerProbe {
  id: string;
  name?: string | null;
  cpfHash?: string | null;
  cpfLast2?: string | null;
  birthDate?: Date | null;
}

/** Nome normalizado para comparação (case-insensitive, espaços colapsados). */
export function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/** Mesma data de nascimento (ano/mes/dia em UTC). */
export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** Sinal forte: mesmo cpfHash (ambos preenchidos). */
export function sameCpfHash(a: PlayerProbe, b: PlayerProbe): boolean {
  return Boolean(a.cpfHash && b.cpfHash && a.cpfHash === b.cpfHash);
}

/** Sinal fraco: mesmo cpfLast2 e mesma data de nascimento. */
export function sameLast2AndDob(a: PlayerProbe, b: PlayerProbe): boolean {
  return Boolean(
    a.cpfLast2 &&
      b.cpfLast2 &&
      a.cpfLast2 === b.cpfLast2 &&
      a.birthDate &&
      b.birthDate &&
      sameDay(a.birthDate, b.birthDate),
  );
}

/** Nome igual (normalizado) e mesma data de nascimento. */
export function sameNameAndDob(a: PlayerProbe, b: PlayerProbe): boolean {
  return Boolean(
    a.name &&
      b.name &&
      normalizeName(a.name) === normalizeName(b.name) &&
      a.birthDate &&
      b.birthDate &&
      sameDay(a.birthDate, b.birthDate),
  );
}

/** Duplicidade provável: qualquer sinal forte ou fraco coincide. */
export function isProbableDuplicate(a: PlayerProbe, b: PlayerProbe): boolean {
  if (a.id === b.id) return false;
  return sameCpfHash(a, b) || sameLast2AndDob(a, b) || sameNameAndDob(a, b);
}

/** Lista candidatos a duplicado de um catalogo em relacao a um probe. */
export function findDuplicates(catalog: readonly PlayerProbe[], probe: PlayerProbe): PlayerProbe[] {
  return catalog.filter((p) => isProbableDuplicate(p, probe));
}
