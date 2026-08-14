import type { ScoringState } from "@/core/scoring/types";
import type { SetEditData } from "@/components/scoring/editScoreHelpers";
import type { TennisFormat } from "@/core/scoring/types";
import { parsePointValue } from "@/core/scoring/point-utils";
import { isMatchTiebreakSet, calculateSetsWon } from "./useSessionManager.utils";
import { getMatchFormatRules, validateSetScore } from "@/lib/matchConfig";

interface BuildNewStateOptions {
  setResults: SetEditData[];
  server: "player1" | "player2";
  format: TennisFormat;
  partialSet?: SetEditData;
}

export function buildNewScoringState(options: BuildNewStateOptions): ScoringState {
  const { setResults, server, format, partialSet } = options;
  
  const setsWon = calculateSetsWon(setResults, format);
  const { setsToWin } = getMatchFormatRules(format);
  const winner =
    setsWon.player1 >= setsToWin
      ? "player1"
      : setsWon.player2 >= setsToWin
        ? "player2"
        : null;
  const isFinished = winner !== null;

  const builtSets = setResults.map((set, idx) => {
    const isMatchTiebreak = isMatchTiebreakSet(idx, setResults, format);
    const isRegularTiebreak = !isMatchTiebreak && set.tiebreakScore !== undefined;
    
    if (isMatchTiebreak) {
      return {
        player1: 0,
        player2: 0,
        isTiebreak: true,
        tiebreakScore: { player1: set.p1Games, player2: set.p2Games },
      };
    }
    
    return {
      player1: set.p1Games,
      player2: set.p2Games,
      isTiebreak: isRegularTiebreak || set.p1Games === 6 && set.p2Games === 6,
      tiebreakScore: set.tiebreakScore ?? null,
    };
  });

  // Correção bug do "set atual" (2026-08-13): garantia da invariante
  // "último item do array `sets[]` = set em andamento".
  // O motor (engine.flow.ts handleGameWon/completeSet) preserva essa
  // invariante ao vivo ao empurrar um novo set vazio após completar um.
  // Mas `buildNewScoringState` só espe-lhava os `setResults` confirmados
  // no modal; se o usuário confirmou um set finalizado como último item
  // (sem adicionar o próximo), o array ficava com set finalizado ao final,
  // levando `ScoreboardCard.tsx:27` (posicional) e `engine.state.ts:35`
  // (loadState que só copia) a tratar o set finalizado como "atual".
  // Solução: se `!isFinished` E o último setResults é finalizado (não
  // parcial e com vencedor determinável), empurrar novo set vazio.
  if (!isFinished && builtSets.length > 0) {
    const lastEditSet = setResults[setResults.length - 1];
    const lastIsFinalized = isLastSetEditFinalized(lastEditSet, format);
    if (lastIsFinalized) {
      builtSets.push({
        player1: 0,
        player2: 0,
        isTiebreak: false,
        tiebreakScore: null,
      });
    }
  }

  return {
    sets: builtSets,
    currentGame: buildCurrentGame(setResults, format, partialSet),
    server,
    setsWon,
    isFinished,
    winner,
    startedAt: Date.now(),
    secondServe: false,
  };
}

// Verifica se o último SetEditData confirmado pelo usuário está "finalizado"
// (i.e. alguém venceu de forma válida conforme regras do formato).
// Mantém consistência com `isSetCompleted` (scoringHelpers.ts:5-29) e
// `isSetComplete` (engine.flow.ts) — distinction parcial vs completo.
function isLastSetEditFinalized(
  set: SetEditData,
  format: string,
): boolean {
  if (!set) return false;
  // Set parcial (em andamento) nunca é finalizado
  if (set.isPartial) return false;

  // Match Tie-Break: usa tiebreakScore (mín 10+2)
  const lastIdxMatchTiebreak = format === 'MATCH_TB_10';
  if (lastIdxMatchTiebreak) {
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

function buildCurrentGame(
  setResults: SetEditData[],
  format: string,
  partialSet?: SetEditData
): ScoringState["currentGame"] {
  const isLastSet = setResults.length > 0;
  const lastSetIdx = setResults.length - 1;
  const isMTSet = isLastSet && isMatchTiebreakSet(lastSetIdx, setResults, format) && setResults[lastSetIdx]?.isPartial === false;

  if (isMTSet) {
    return {
      player1: 0,
      player2: 0,
      isDeuce: false,
      advantage: null,
      secondServe: false,
    };
  }

  // If set is partial (incomplete), preserve the current game points selected by user
  // If set is complete, reset game points to 0
  const shouldUseGamePoints = partialSet?.isPartial === true;
  
  return {
    player1: shouldUseGamePoints ? parsePointValue(partialSet.currentGamePoints?.player1 ?? 0) : 0,
    player2: shouldUseGamePoints ? parsePointValue(partialSet.currentGamePoints?.player2 ?? 0) : 0,
    isDeuce: false,
    advantage: null,
    secondServe: false,
  };
}