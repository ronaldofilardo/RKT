import type { ScoringState, TennisFormat } from "@/core/scoring/types";
import type { SetEditData } from "@/core/scoring/edit-score-domain";
import { isMatchTiebreakSet } from "./use-session-manager.logic";
import { getMatchFormatRules, validateSetScore, isMatchTiebreakSetIndex } from "@/lib/matchConfig";
import { createEmptySetForFormat } from "@/core/scoring/format-rules";

// Set "em andamento" vazio que entra no array depois de um set finalizado.
// Sets Curtos 2/2: o próximo set nasce em 2-2 (e não 0-0) — ou como Match
// Tiebreak (games 0-0, tiebreak 0-0) quando a partida está 1x1. Demais
// formatos mantêm o set vazio 0-0.
export function buildNextEmptySet(
  format: TennisFormat,
  setsWon: { player1: number; player2: number },
  nextIndex: number,
): ScoringState["sets"][number] {
  if (format === "SHORT_SET_2V2_NO_AD") {
    if (isMatchTiebreakSetIndex(nextIndex, setsWon, format)) {
      return { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 0, player2: 0 } };
    }
    return createEmptySetForFormat(format);
  }
  return { player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null };
}

// Verifica se o último SetEditData confirmado pelo usuário está "finalizado"
// (i.e. alguém venceu de forma válida conforme regras do formato).
// Mantém consistência com `isSetCompleted` (scoringHelpers.ts:5-29) e
// `isSetComplete` (engine.flow.ts) — distinction parcial vs completo.
export function isLastSetEditFinalized(
  set: SetEditData,
  format: string,
  setResults: SetEditData[],
  index: number,
): boolean {
  if (!set) return false;
  // Set parcial (em andamento) nunca é finalizado
  if (set.isPartial) return false;

  // Match Tie-Break (todos os formatos): detectar via isMatchTiebreakSet
  // e aplicar regra mínima de 10 pontos com diferença de 2.
  // Antes só detectava MATCH_TB_10 — agora cobre BEST_OF_5, BEST_OF_3_MATCH_TB, etc.
  if (isMatchTiebreakSet(index, setResults, format)) {
    const tb = set.tiebreakScore;
    const p1 = tb ? tb.player1 : set.p1Games;
    const p2 = tb ? tb.player2 : set.p2Games;
    return (p1 >= 10 && p1 - p2 >= 2) || (p2 >= 10 && p2 - p1 >= 2);
  }

  // Set com tiebreak regular (7-6 com TB 7-x): considerar tipicamente finalizado
  // quando alguém venceu o tiebreak.
  if (set.tiebreakScore) {
    const tb = set.tiebreakScore;
    const tbP1Won = tb.player1 >= 7 && tb.player1 - tb.player2 >= 2;
    const tbP2Won = tb.player2 >= 7 && tb.player2 - tb.player1 >= 2;
    if (tbP1Won || tbP2Won) return true;
  }

  // Set normal: validar conforme as regras do formato
  try {
    const rules = getMatchFormatRules(format as TennisFormat);
    return validateSetScore(set.p1Games, set.p2Games, rules).complete;
  } catch {
    // Fallback: 6+ games, dif 2 (ou 7-x para allow tiebreak)
    const diff = Math.abs(set.p1Games - set.p2Games);
    const max = Math.max(set.p1Games, set.p2Games);
    return (max >= 6 && diff >= 2) || (max === 7 && diff >= 1 && max >= 6);
  }
}
