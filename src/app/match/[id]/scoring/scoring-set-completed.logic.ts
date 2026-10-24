import { validateSetScore, getMatchFormatRules, isMatchTiebreakSetIndex as isMatchTiebreakSetIndexCanonical } from "@/lib/matchConfig";
import type { TennisFormat } from "@/lib/matchConfig";

export function isMatchTiebreakSetIndex(format: TennisFormat | undefined, setIndex: number, setsWon?: { player1: number; player2: number }): boolean {
  if (!format || !setsWon) return false;
  return isMatchTiebreakSetIndexCanonical(setIndex, setsWon, format);
}

export function getTiebreakMinimumForSet(format: TennisFormat | undefined, setIndex: number, setsWon?: { player1: number; player2: number }): number {
  return isMatchTiebreakSetIndex(format, setIndex, setsWon) ? 10 : 7;
}

export function isSetCompleted(
  set: { player1: number; player2: number; isTiebreak?: boolean; tiebreakScore?: { player1: number; player2: number } | null },
  format?: TennisFormat,
  setIndex?: number,
  setsWon?: { player1: number; player2: number },
): boolean {
  // Check tiebreak score FIRST (standard or match tiebreak)
  if (set.isTiebreak && set.tiebreakScore) {
    const tbMin = getTiebreakMinimumForSet(format, setIndex ?? 0, setsWon);
    const tb = set.tiebreakScore;
    return (tb.player1 >= tbMin && tb.player1 - tb.player2 >= 2) ||
           (tb.player2 >= tbMin && tb.player2 - tb.player1 >= 2);
  }

  if (format) {
    try {
      const rules = getMatchFormatRules(format);
      return validateSetScore(set.player1, set.player2, rules).complete;
    } catch {
      // ste-exception R-08: função de domínio puro (R-05) — I/O proibido.
      // Formato desconhecido degrada deliberadamente para a regra padrão de 6 jogos.
    }
  }
  // Fallback: standard 6-game rules
  const diff = Math.abs(set.player1 - set.player2);
  const max = Math.max(set.player1, set.player2);
  if (max >= 6 && diff >= 2) return true;
  return false;
}
