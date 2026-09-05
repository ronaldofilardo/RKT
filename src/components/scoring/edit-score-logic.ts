import type { TennisFormat } from '@/core/scoring/types';
import type { SetEditData } from './editScoreHelpers';
import {
  validateSetResult,
  validateMatchTiebreakInput,
  getNextServerAfterSet,
} from './editScoreHelpers';
import {
  setsToWinForFormat,
  totalSetsForFormat,
} from '@/core/scoring/format-rules';
import { parsePointValue } from '@/core/scoring/point-utils';
import { isMatchTiebreakSet as isMatchTiebreakSetUtil } from '@/hooks/useSessionManager.utils';

type Player = 'player1' | 'player2';

export type { Player };

export interface CompletedSet {
  games: Record<Player, number>;
  winner: Player;
  tiebreakScore?: { player1: number; player2: number };
}

export interface EditScoreState {
  p1Input: string;
  p2Input: string;
  p1Points: string;
  p2Points: string;
  nextServer: Player;
  tiebreakP1: string;
  tiebreakP2: string;
  newSets: SetEditData[];
}

export interface EditScoreValidation {
  bothFilled: boolean;
  p1Val: number;
  p2Val: number;
  setValidation: ReturnType<typeof validateSetResult> | null;
  hasWinner: boolean;
  completed: boolean;
  isSetTrulyCompleted: boolean;
  setValidationError: string | undefined;
  hasTiebreak: boolean;
  isMatchTiebreakSet: boolean;
  isPotentialMTSet: boolean;
  tiebreakComplete?: boolean;
  hasValidTiebreak?: boolean;
  tiebreakP1Num?: number;
  tiebreakP2Num?: number;
}

export interface EditScoreMatchState {
  p1SetsWonFromProp: number;
  p2SetsWonFromProp: number;
  newP1SetsWon: number;
  newP2SetsWon: number;
  p1SetsWon: number;
  p2SetsWon: number;
  matchAlreadyOver: boolean;
  matchWouldEnd: boolean;
  totalEditedSets: number;
  isMatchTiebreakSet: boolean;
  isPotentialMTSet: boolean;
  maxSets: number;
  setsToWin: number;
}

export interface TiebreakInput {
  tiebreakP1?: string;
  tiebreakP2?: string;
}

export interface GameScoreInput {
  p1Input: string;
  p2Input: string;
}

export interface ValidationContext {
  matchFormat: TennisFormat;
  totalEditedSets: number;
  setResults?: SetEditData[];
}

export interface EditScoreValidationInput extends GameScoreInput, TiebreakInput, ValidationContext {}

export interface CompletedSetsInput {
  completedSets: CompletedSet[];
}

export interface NewSetsInput {
  newSets: SetEditData[];
}

export interface ValidationResultInput {
  validation: EditScoreValidation;
}

export interface EditScoreMatchStateInput
  extends ValidationContext,
    CompletedSetsInput,
    NewSetsInput,
    ValidationResultInput {}

export interface SetResultInput {
  p1Val: number;
  p2Val: number;
  isSetTrulyCompleted: boolean;
  hasTiebreak: boolean;
  tiebreakP1Num: number;
  tiebreakP2Num: number;
  isMatchTiebreakSet: boolean;
  isPotentialMTSet: boolean;
  p1Points: string;
  p2Points: string;
  currentSets: { player1: number; player2: number };
  matchFormat?: TennisFormat;
}

export interface CreateSetEditDataInput extends SetResultInput {}

export interface AutoAddSetContext {
  validation: EditScoreValidation;
  matchState: EditScoreMatchState;
  currentSets: { player1: number; player2: number };
}

export interface ShouldAutoAddSetInput extends AutoAddSetContext {
  p1Val: number;
  p2Val: number;
}

export interface NextServerContext {
  currentServer: Player;
  p1Games: number;
  p2Games: number;
  matchFormat: TennisFormat;
  tiebreakScore: { player1: number; player2: number } | null;
  completedSets: CompletedSet[];
}

export interface CalculateNextServerInput extends NextServerContext {}

export function createInitialEditScoreState(currentServer: Player): EditScoreState {
  return {
    p1Input: '',
    p2Input: '',
    p1Points: '0',
    p2Points: '0',
    nextServer: currentServer,
    tiebreakP1: '',
    tiebreakP2: '',
    newSets: [],
  };
}

/**
 * Checks if a set is a "potential MT set" — a deciding set where MT may
 * activate at 6-6 but the set starts as a regular set.
 * For BEST_OF_5: 5th set when score is 2-2.
 * For BEST_OF_3_MATCH_TB/SHORT_SET/NO_AD: always MT at decider (no potential phase).
 */
export function isPotentialMTSet(
  format: TennisFormat,
  totalEditedSets: number,
  setResults?: SetEditData[],
): boolean {
  if (format !== 'BEST_OF_5') return false;
  const currentSetNum = totalEditedSets + 1;
  if (currentSetNum !== 5) return false;

  if (setResults && setResults.length > 0) {
    let p1Sets = 0;
    let p2Sets = 0;
    for (const s of setResults) {
      const isPartial = 'isPartial' in s ? s.isPartial : false;
      if (!isPartial) {
        if (s.p1Games > s.p2Games) p1Sets++;
        else if (s.p2Games > s.p1Games) p2Sets++;
      }
    }
    return p1Sets === 2 && p2Sets === 2;
  }

  // Fallback: without setResults we cannot verify the 2-2 score, so assume
  // not a potential MT set. Previously returned `totalEditedSets === 4` which
  // is true for any 5th set regardless of the actual score — Bug #13.
  return false;
}

export function calculateValidation(input: EditScoreValidationInput): EditScoreValidation {
  const { p1Input, p2Input, matchFormat, totalEditedSets, setResults, tiebreakP1, tiebreakP2 } = input;
  const p1Val = p1Input === '' ? NaN : parseInt(p1Input, 10);
  const p2Val = p2Input === '' ? NaN : parseInt(p2Input, 10);
  const bothFilled = !isNaN(p1Val) && !isNaN(p2Val) && p1Val >= 0 && p2Val >= 0;

  const potentialMT = isPotentialMTSet(matchFormat, totalEditedSets, setResults);

  let isMatchTiebreakSet: boolean;
  if (potentialMT) {
    isMatchTiebreakSet = bothFilled && p1Val === 6 && p2Val === 6;
  } else if (setResults && setResults.length > 0) {
    isMatchTiebreakSet = isMatchTiebreakSetUtil(totalEditedSets, setResults, matchFormat);
  } else {
    isMatchTiebreakSet =
      matchFormat === 'MATCH_TB_10' ||
      (matchFormat === 'BEST_OF_3_MATCH_TB' && totalEditedSets === 2) ||
      (matchFormat === 'SHORT_SET_2V2_NO_AD' && totalEditedSets === 2) ||
      (matchFormat === 'BEST_OF_3_NO_AD' && totalEditedSets === 2);
  }

  const setValidation = bothFilled
    ? isMatchTiebreakSet
      ? validateMatchTiebreakInput({ p1Points: p1Val, p2Points: p2Val })
      : validateSetResult({ p1Games: p1Val, p2Games: p2Val }, matchFormat)
    : null;

  const hasWinner = setValidation?.winner !== undefined;
  const completed = hasWinner && !setValidation?.isPartial;

  // Bug (2026-09-02): campo de TB vazio (usuário ainda não digitou nada)
  // representa um tie-break que ainda não começou (0x0) — ex.: retomar
  // uma partida anotada em 6-6 games. Antes, campo vazio virava NaN e
  // bloqueava o botão "Confirmar" mesmo com o set corretamente em 6x6/0x0.
  const tbP1Num = tiebreakP1 ? parseInt(tiebreakP1, 10) : 0;
  const tbP2Num = tiebreakP2 ? parseInt(tiebreakP2, 10) : 0;
  const hasValidTiebreak = !isNaN(tbP1Num) && !isNaN(tbP2Num) && tbP1Num >= 0 && tbP2Num >= 0;
  const tiebreakCompleteLocal =
    setValidation?.tiebreakRequired ?
      hasValidTiebreak && ((tbP1Num >= 7 || tbP2Num >= 7) && Math.abs(tbP1Num - tbP2Num) >= 2) :
      false;

  const isSetTrulyCompleted = completed && (!setValidation?.tiebreakRequired || tiebreakCompleteLocal);
  const setValidationError = isSetTrulyCompleted ? undefined : setValidation?.error;
  const hasTiebreak = setValidation?.hasTiebreak ?? false;
  const isPotentialMTSetResult = potentialMT && !isMatchTiebreakSet;

  return {
    bothFilled,
    p1Val,
    p2Val,
    setValidation,
    hasWinner,
    completed,
    isSetTrulyCompleted,
    setValidationError,
    hasTiebreak,
    isMatchTiebreakSet,
    isPotentialMTSet: isPotentialMTSetResult,
    hasValidTiebreak,
    tiebreakComplete: tiebreakCompleteLocal,
  };
}

function buildSetResultsForCheck(
  completedSets: CompletedSet[],
  newSets: SetEditData[],
): SetEditData[] {
  return [
    ...completedSets.map((s) => ({
      p1Games: s.games.player1,
      p2Games: s.games.player2,
      isPartial: false,
    })),
    ...newSets,
  ];
}

function computeSetsWon(
  completedSets: CompletedSet[],
  newSets: SetEditData[],
  validation: EditScoreValidation,
): { p1SetsWon: number; p2SetsWon: number; p1SetsWonFromProp: number; p2SetsWonFromProp: number; newP1SetsWon: number; newP2SetsWon: number } {
  const p1SetsWonFromProp = completedSets.filter((s) => s.winner === 'player1').length;
  const p2SetsWonFromProp = completedSets.filter((s) => s.winner === 'player2').length;

  const newP1SetsWon = newSets.filter((s) => {
    if (s.tiebreakScore) {
      return s.tiebreakScore.player1 > s.tiebreakScore.player2;
    }
    return s.p1Games > s.p2Games;
  }).length;
  const newP2SetsWon = newSets.filter((s) => {
    if (s.tiebreakScore) {
      return s.tiebreakScore.player2 > s.tiebreakScore.player1;
    }
    return s.p2Games > s.p1Games;
  }).length;

  const p1SetsWon =
    p1SetsWonFromProp +
    newP1SetsWon +
    (validation.isSetTrulyCompleted && validation.setValidation?.winner === 'player1' ? 1 : 0);
  const p2SetsWon =
    p2SetsWonFromProp +
    newP2SetsWon +
    (validation.isSetTrulyCompleted && validation.setValidation?.winner === 'player2' ? 1 : 0);

  return {
    p1SetsWon,
    p2SetsWon,
    p1SetsWonFromProp,
    p2SetsWonFromProp,
    newP1SetsWon,
    newP2SetsWon,
  };
}

function determineMatchTiebreakStatus(
  format: TennisFormat,
  totalEditedSets: number,
  setResultsForCheck: SetEditData[],
  potentialMT: boolean,
  validation: EditScoreValidation,
): { isMatchTiebreakSet: boolean; isPotentialMTSetResult: boolean } {
  let isMatchTiebreakSet: boolean;
  if (potentialMT) {
    isMatchTiebreakSet = validation.isMatchTiebreakSet;
  } else if (setResultsForCheck.length > 0) {
    isMatchTiebreakSet = isMatchTiebreakSetUtil(totalEditedSets, setResultsForCheck, format);
  } else {
    isMatchTiebreakSet =
      format === 'MATCH_TB_10' ||
      (format === 'BEST_OF_3_MATCH_TB' && totalEditedSets === 2) ||
      (format === 'SHORT_SET_2V2_NO_AD' && totalEditedSets === 2) ||
      (format === 'BEST_OF_3_NO_AD' && totalEditedSets === 2);
  }

  const isPotentialMTSetResult = potentialMT && !isMatchTiebreakSet;

  return { isMatchTiebreakSet, isPotentialMTSetResult };
}

export function calculateMatchState(input: EditScoreMatchStateInput): EditScoreMatchState {
  const { matchFormat, completedSets, newSets, validation } = input;
  const maxSets = totalSetsForFormat(matchFormat);
  const setsToWin = setsToWinForFormat(matchFormat);
  const totalEditedSets = completedSets.length + newSets.length;

  const setResultsForCheck = buildSetResultsForCheck(completedSets, newSets);
  const potentialMT = isPotentialMTSet(matchFormat, totalEditedSets, setResultsForCheck);

  const { isMatchTiebreakSet, isPotentialMTSetResult } = determineMatchTiebreakStatus(
    matchFormat,
    totalEditedSets,
    setResultsForCheck,
    potentialMT,
    validation,
  );

  const { p1SetsWon, p2SetsWon, p1SetsWonFromProp, p2SetsWonFromProp, newP1SetsWon, newP2SetsWon } = computeSetsWon(
    completedSets,
    newSets,
    validation,
  );

  const matchAlreadyOver = p1SetsWonFromProp >= setsToWin || p2SetsWonFromProp >= setsToWin;
  const matchWouldEnd = p1SetsWon >= setsToWin || p2SetsWon >= setsToWin;

  return {
    p1SetsWonFromProp,
    p2SetsWonFromProp,
    newP1SetsWon,
    newP2SetsWon,
    p1SetsWon,
    p2SetsWon,
    matchAlreadyOver,
    matchWouldEnd,
    totalEditedSets,
    isMatchTiebreakSet,
    isPotentialMTSet: isPotentialMTSetResult,
    maxSets,
    setsToWin,
  };
}

export function calculateTiebreakValidation(
  tiebreakP1: string,
  tiebreakP2: string,
  hasTiebreak: boolean,
): { hasValidTiebreak: boolean; tiebreakComplete: boolean; tiebreakP1Num: number; tiebreakP2Num: number } {
  // Bug (2026-09-02): ver comentário equivalente em calculateValidation —
  // campo vazio de TB representa 0x0 (tie-break ainda não começou), não
  // um valor inválido/ausente.
  const tiebreakP1Num = tiebreakP1 ? parseInt(tiebreakP1, 10) : 0;
  const tiebreakP2Num = tiebreakP2 ? parseInt(tiebreakP2, 10) : 0;
  const hasValidTiebreak =
    !isNaN(tiebreakP1Num) &&
    !isNaN(tiebreakP2Num) &&
    tiebreakP1Num >= 0 &&
    tiebreakP2Num >= 0;
  const tiebreakComplete =
    hasTiebreak &&
    hasValidTiebreak &&
    ((tiebreakP1Num >= 7 || tiebreakP2Num >= 7) && Math.abs(tiebreakP1Num - tiebreakP2Num) >= 2);

  return { hasValidTiebreak, tiebreakComplete, tiebreakP1Num, tiebreakP2Num };
}

export function createSetEditData(input: CreateSetEditDataInput): SetEditData {
  const { p1Val, p2Val, isSetTrulyCompleted, hasTiebreak, tiebreakP1Num, tiebreakP2Num, isMatchTiebreakSet, isPotentialMTSet, p1Points, p2Points, matchFormat } = input;
  const setData: SetEditData = {
    p1Games: p1Val,
    p2Games: p2Val,
    isPartial: !isSetTrulyCompleted,
  };

  if (isMatchTiebreakSet) {
    // Bug (2026-09-02): p1Val/p2Val aqui são os PONTOS do match tiebreak
    // (ex.: 10x8), não games. Salvá-los direto em p1Games/p2Games fazia o
    // placar dinâmico mostrar "10/8" em vez do games real do set.
    // No BEST_OF_5, o 5º set só vira MT em 6x6 — o games final deve ser
    // 7x6 (ou 6x7), como o motor de pontuação ao vivo já produz via
    // completeSetWithTiebreak. Nos formatos "MT puro" (MATCH_TB_10 etc.),
    // o set começa em 0x0, então o games final correto é 1x0 (ou 0x1).
    const baseGames = matchFormat === 'BEST_OF_5' ? 6 : 0;
    const winner: Player = p1Val > p2Val ? 'player1' : 'player2';
    setData.p1Games = winner === 'player1' ? baseGames + 1 : baseGames;
    setData.p2Games = winner === 'player2' ? baseGames + 1 : baseGames;
    setData.tiebreakScore = {
      player1: p1Val,
      player2: p2Val,
    };
  } else if (hasTiebreak && !isPotentialMTSet && tiebreakP1Num >= 0 && tiebreakP2Num >= 0) {
    setData.tiebreakScore = {
      player1: tiebreakP1Num,
      player2: tiebreakP2Num,
    };
  } else if (!isSetTrulyCompleted) {
    setData.currentGamePoints = {
      player1: parsePointValue(p1Points),
      player2: parsePointValue(p2Points),
    };
  }

  return setData;
}

export function shouldAutoAddSet(input: ShouldAutoAddSetInput): boolean {
  const { validation, matchState, currentSets, p1Val, p2Val } = input;
  if (!validation.isSetTrulyCompleted) return false;
  if (matchState.matchWouldEnd) return false;
  if (matchState.totalEditedSets >= matchState.maxSets - 1) return false;
  if (matchState.matchAlreadyOver) return false;
  if (matchState.isMatchTiebreakSet) return false;

  const scoreWasChanged = p1Val !== currentSets.player1 || p2Val !== currentSets.player2;
  if (!scoreWasChanged) return false;

  return true;
}

export function calculateNextServer(input: CalculateNextServerInput): Player {
  const { currentServer, p1Games, p2Games, matchFormat, tiebreakScore, completedSets } = input;
  const completedSetsGames = completedSets.map((cs) => ({ player1: cs.games.player1, player2: cs.games.player2 }));
  return getNextServerAfterSet({
    currentServer,
    p1Games,
    p2Games,
    format: matchFormat,
    tiebreakPoints: tiebreakScore ?? null,
    completedSets: completedSetsGames,
  });
}