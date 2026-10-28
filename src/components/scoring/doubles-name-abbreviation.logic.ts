/**
 * Abrevia o nome de um atleta para exibição em duplas.
 *
 * Regras:
 * - Nome com sobrenome: "Álvaro Baena" → "A. Baena"
 * - Nome único: "Djokovic" → "Djokovic"
 * - Iniciais repetidas: preserva o sobrenome completo para distinguir
 * - Nomes longos: sobrenome não é truncado (o truncamento fica a cargo do container com `truncate` + `title`)
 */
export function abbreviatePlayerName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  const firstInitial = parts[0].charAt(0).toUpperCase();
  const lastName = parts[parts.length - 1];
  return `${firstInitial}. ${lastName}`;
}

/**
 * Abrevia o nome de uma dupla em uma única linha, ex: "A. Baena/A. Ruppel".
 * Se não houver parceiro, retorna apenas o nome do jogador abreviado.
 */
export function abbreviateDoublesName(playerName: string, partnerName?: string | null): string {
  const p1 = abbreviatePlayerName(playerName);
  if (!partnerName) return p1;
  const p2 = abbreviatePlayerName(partnerName);
  return `${p1}/${p2}`;
}
