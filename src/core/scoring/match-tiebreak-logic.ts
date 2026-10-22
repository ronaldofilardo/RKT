import type { SetEditData } from '@/core/scoring/edit-score-domain';
import { isMatchTiebreakSetIndex as isMatchTiebreakSetIndexCanonical, type TennisFormat } from '@/lib/matchConfig';

/**
 * Determina se um set no índice dado é um Match Tie-Break.
 * Delega à função canônica em lib/matchConfig.ts.
 *
 * @param index - Índice do set (0-based)
 * @param setResults - Array de resultados de sets já editados
 * @param format - Formato da partida
 * @returns true se este set deve ser um Match Tie-Break
 */
export function isMatchTiebreakSet(index: number, setResults: SetEditData[], format: string): boolean {
  // Contar sets já vencidos (não parciais) antes deste índice
  let p1Sets = 0;
  let p2Sets = 0;
  for (let i = 0; i < index; i++) {
    const s = setResults[i];
    if (!s) continue;
    const isPartial = 'isPartial' in s ? s.isPartial : false;
    if (!isPartial) {
      if (s.p1Games > s.p2Games) {
        p1Sets++;
      } else if (s.p2Games > s.p1Games) {
        p2Sets++;
      } else if (s.tiebreakScore) {
        if (s.tiebreakScore.player1 > s.tiebreakScore.player2) p1Sets++;
        else if (s.tiebreakScore.player2 > s.tiebreakScore.player1) p2Sets++;
      }
    }
  }

  // Para BEST_OF_5, verificar se o set atual já tem 6-6
  const currentSet = setResults[index];
  const currentSetGames = currentSet
    ? { player1: currentSet.p1Games, player2: currentSet.p2Games }
    : undefined;

  return isMatchTiebreakSetIndexCanonical(
    index,
    { player1: p1Sets, player2: p2Sets },
    format as TennisFormat,
    currentSetGames,
  );
}
