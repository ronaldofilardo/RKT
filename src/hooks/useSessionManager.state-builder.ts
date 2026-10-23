import type { ScoringState, DoublesArrangement } from "@/core/scoring/types";
import type { TennisFormat } from "@/core/scoring/types";
import type { SetEditData } from "@/core/scoring/edit-score-domain";
import { isMatchTiebreakSet, calculateSetsWon } from "./use-session-manager.logic";
import { getMatchFormatRules } from "@/lib/matchConfig";
import { buildNextEmptySet, isLastSetEditFinalized } from "./useSessionManager.state-builder.sets";
import { buildCurrentGame } from "./useSessionManager.state-builder.game";

interface BuildNewStateOptions {
  setResults: SetEditData[];
  server: "player1" | "player2";
  format: TennisFormat;
  partialSet?: SetEditData;
  doubles?: DoublesArrangement;
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
        tiebreakScore: set.tiebreakScore ?? { player1: set.p1Games, player2: set.p2Games },
      };
    }
    
    return {
      player1: set.p1Games,
      player2: set.p2Games,
      // Só marcar isTiebreak:true quando:
      // 1. É um regular tiebreak (tiebreakScore definido) OU
      // 2. É um MT (isMatchTiebreak) - nestes casos, o set começa 0-0 e os pontos vão para tiebreakScore
      // NÃO marcar quando 6-6 sem tiebreak disputado ainda
      isTiebreak: isRegularTiebreak,
      tiebreakScore: set.tiebreakScore ?? null,
    };
  });

  // Correção bug do "set atual" (2026-08-13): garantia da invariante
  // "último item do array `sets[]` = set em andamento".
  // O motor (engine.flow.ts onGameWon/completeSet) preserva essa
  // invariante ao vivo ao empurrar um novo set vazio após completar um.
  // Mas `buildNewScoringState` só espe-lhava os `setResults` confirmados
  // no modal; se o usuário confirmou um set finalizado como último item
  // (sem adicionar o próximo), o array ficava com set finalizado ao final,
  // levando `ScoreboardCard.tsx:27` (posicional) e `engine.state.ts:35`
  // (loadState que só copia) a tratar o set finalizado como "atual".
  // Solução: se `!isFinished` E o último setResults é finalizado (não
  // parcial e com vencedor determinável), empurrar novo set vazio.
  if (!isFinished && builtSets.length > 0) {
    const lastIdx = setResults.length - 1;
    const lastEditSet = setResults[lastIdx];
    const lastIsFinalized = isLastSetEditFinalized(lastEditSet, format, setResults, lastIdx);
    if (lastIsFinalized) {
      builtSets.push(buildNextEmptySet(format, setsWon, builtSets.length));
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
    ...(options.doubles ? { doubles: options.doubles } : {}),
  };
}
