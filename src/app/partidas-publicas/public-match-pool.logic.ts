export interface PoolPlayerRef {
  id: string;
  name: string;
  nickname?: string | null;
}

export interface PublicPoolMatch {
  id: string;
  format: string;
  matchType: string;
  sportType: string;
  courtType: string | null;
  scheduledAt: string | null;
  tournamentName: string | null;
  clubName: string | null;
  category: string | null;
  round: string | null;
  ctId: string | null;
  annotationCount: number;
  eventScope?: string;
  myAnnotationId?: string | null;
  myAnnotationState?: string | null;
  player1: PoolPlayerRef;
  player2: PoolPlayerRef;
}

/** Busca local por atletas, torneio, clube, categoria ou rodada. */
export function filterPoolMatches(
  matches: readonly PublicPoolMatch[],
  term: string,
): PublicPoolMatch[] {
  const q = term.trim().toLowerCase();
  if (!q) return [...matches];

  return matches.filter((match) =>
    [
      match.player1?.name,
      match.player1?.nickname,
      match.player2?.name,
      match.player2?.nickname,
      match.tournamentName,
      match.clubName,
      match.category,
      match.round,
    ]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(q)),
  );
}

/** Data/hora do cartaz no formato brasileiro; ausência vira "Data a definir". */
export function formatPoolDate(value: string | null): string {
  if (!value) return 'Data a definir';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data a definir';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Rótulo curto do formato para o card do pool. */
export function poolFormatLabel(format: string): string {
  const labels: Record<string, string> = {
    BEST_OF_3: 'Melhor de 3',
    BEST_OF_3_MATCH_TB: 'Melhor de 3 + Match TB',
    BEST_OF_3_NO_AD: 'Melhor de 3 No-Ad',
    BEST_OF_5: 'Melhor de 5',
    SHORT_SET_2V2_NO_AD: 'Sets curtos 2/2 No-Ad',
    MATCH_TB_10: 'Match Tiebreak 10',
    PRO_SET_8: 'Set Pro até 8',
  };
  return labels[format] ?? format;
}
