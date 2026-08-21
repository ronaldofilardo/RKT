import type { ScoringState } from "@/core/scoring/types";
import type { SetEditData } from "@/components/scoring/editScoreHelpers";
import type { TennisFormat } from "@/core/scoring/types";
import { isMatchTiebreakSet, calculateSetsWon } from "./useSessionManager.utils";
import { getMatchFormatRules } from "@/lib/matchConfig";
import {
  buildCurrentGameFromSet,
  isLastSetFinalized,
} from './useSessionManager.state-builder.helpers';

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
  return isLastSetFinalized(set, format);
}

function buildCurrentGame(
  setResults: SetEditData[],
  format: string,
  partialSet?: SetEditData
): ScoringState["currentGame"] {
  return buildCurrentGameFromSet(setResults, format, partialSet);
}