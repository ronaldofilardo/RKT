import type { CompletedSet } from './edit-score-logic';
import type { SetEditData } from './editScoreHelpers';
import { logger } from '@/lib/logger';

type PlayerSide = 'player1' | 'player2';
type FloorSets = { player1: number; player2: number };
type PointParser = (value: string) => number;
type PointProgress = (value: number) => number;

type ValidationData = {
  setValidationError?: string | null;
  setValidation?: { winner?: PlayerSide; tiebreakRequired?: boolean } | null;
};

type MatchState = {
  p1SetsWonFromProp: number;
  p2SetsWonFromProp: number;
  newP1SetsWon: number;
  newP2SetsWon: number;
};

type EditableSet = Omit<SetEditData, 'tiebreakScore'> & { tiebreakScore?: SetEditData['tiebreakScore'] | null };

type EditableState = {
  editableCompletedSets?: EditableSet[];
  newSets: SetEditData[];
  p1Points: string;
  p2Points: string;
};

type ValidationArgs = {
  floorValidationError: string | null;
  validation: ValidationData;
  partial: boolean;
  bothFilled: boolean;
  hasTiebreak: boolean;
  isSetTrulyCompleted: boolean;
  tiebreakComplete: boolean;
  hasValidTiebreak: boolean;
  p1Val: number;
  p2Val: number;
  tiebreakP1Num: number;
  tiebreakP2Num: number;
  matchWouldEnd: boolean;
  matchState: MatchState;
  setsToWin: number;
  setWinner: PlayerSide;
  playerNames: { p1: string; p2: string };
  floorCurrentSets?: FloorSets | null;
  canAddNextSet: boolean;
  maxSets: number;
  initialGame: { player1: string; player2: string } | null;
  currentSets: FloorSets;
  p1Points: string;
  p2Points: string;
  parsePointValue: PointParser;
  pointToProgress: PointProgress;
};

type FinalSetsArgs = {
  state: EditableState;
  completedSets: CompletedSet[];
  bothFilled: boolean;
  p1Val: number;
  p2Val: number;
  isSetTrulyCompleted: boolean;
  hasTiebreak: boolean;
  tiebreakP1Num: number;
  tiebreakP2Num: number;
  isMatchTiebreakSet: boolean;
  isPotentialMTSet: boolean;
  currentSets: FloorSets;
  createSetEditData: (args: {
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
    currentSets: FloorSets;
  }) => SetEditData;
};

export function getTiebreakWinnerError(args: ValidationArgs): string | null {
  if (!args.bothFilled || !args.hasTiebreak || !args.isSetTrulyCompleted || !args.tiebreakComplete) return null;
  const setWinner = args.p1Val > args.p2Val ? 'player1' : 'player2';
  const tiebreakWinner = args.tiebreakP1Num > args.tiebreakP2Num ? 'player1' : 'player2';
  return setWinner === tiebreakWinner ? null : 'Vencedor do tiebreak não corresponde ao vencedor do set.';
}

export function getMatchEndError(args: ValidationArgs): string | null {
  if (!args.isSetTrulyCompleted || !args.matchWouldEnd) return null;
  const p1Sets = args.matchState.p1SetsWonFromProp + args.matchState.newP1SetsWon + (args.setWinner === 'player1' ? 1 : 0);
  const p2Sets = args.matchState.p2SetsWonFromProp + args.matchState.newP2SetsWon + (args.setWinner === 'player2' ? 1 : 0);
  if (p1Sets <= args.setsToWin && p2Sets <= args.setsToWin) return null;
  const winner = p1Sets > args.setsToWin ? args.playerNames.p1 : args.playerNames.p2;
  return `Partida já encerrou com ${args.setsToWin} sets para ${winner}.`;
}

export function getFloorError(p1: number, p2: number, floor: FloorSets | null | undefined): string | null {
  if (p1 < (floor?.player1 ?? p1) || p2 < (floor?.player2 ?? p2)) return `Placar não pode ser inferior ao ponto de parada (${floor?.player1}x${floor?.player2}).`;
  return null;
}

export function getPointRegressionError(args: ValidationArgs): string | null {
  if (args.isSetTrulyCompleted || !args.initialGame || args.p1Val !== args.currentSets.player1 || args.p2Val !== args.currentSets.player2) return null;
  const oldP1 = args.pointToProgress(args.parsePointValue(args.initialGame.player1));
  const oldP2 = args.pointToProgress(args.parsePointValue(args.initialGame.player2));
  const newP1 = args.pointToProgress(args.parsePointValue(args.p1Points));
  const newP2 = args.pointToProgress(args.parsePointValue(args.p2Points));
  return (newP1 < oldP1 && newP2 <= oldP2) || (newP2 < oldP2 && newP1 <= oldP1) ? 'Placar não pode ser inferior ao estado atual' : null;
}

export function getCompletedSets(state: EditableState, completedSets: CompletedSet[]): SetEditData[] {
  const source = state.editableCompletedSets?.length ? state.editableCompletedSets : completedSets;
  return source.map((set) => {
    const p1Games = 'games' in set ? set.games.player1 : set.p1Games;
    const p2Games = 'games' in set ? set.games.player2 : set.p2Games;
    return {
      p1Games,
      p2Games,
      isPartial: false,
      ...(set.tiebreakScore ? { tiebreakScore: set.tiebreakScore } : {}),
    };
  });
}

export function getSetWinner(validation: ValidationData): PlayerSide {
  return validation.setValidation?.winner === 'player1' ? 'player1' : 'player2';
}

function getBasicValidationBlock(args: ValidationArgs): string | null {
  if (args.floorValidationError) return '';
  if (args.validation.setValidationError && !args.partial) return '';
  if (args.validation.setValidation?.tiebreakRequired && !args.hasValidTiebreak) return '';
  return null;
}

function getSetValidationBlock(args: ValidationArgs): string | null {
  return getTiebreakWinnerError(args) || getMatchEndError(args) || (args.bothFilled ? getFloorError(args.p1Val, args.p2Val, args.floorCurrentSets) : null);
}

function getCompletionBlock(args: ValidationArgs): string | null {
  return args.isSetTrulyCompleted && !args.matchWouldEnd && !args.canAddNextSet && args.maxSets > 1 ? '' : null;
}

export async function getFreshFloorError(onRefreshFloor: (() => Promise<FloorSets | null>) | undefined, floorCurrentSets: FloorSets | null | undefined, isSetTrulyCompleted: boolean, p1Val: number, p2Val: number): Promise<string | null> {
  if (!onRefreshFloor || !floorCurrentSets || isSetTrulyCompleted) return null;
  try {
    const freshFloor = await onRefreshFloor();
    return freshFloor && (p1Val < freshFloor.player1 || p2Val < freshFloor.player2)
      ? `Placar atualizado: ${freshFloor.player1}x${freshFloor.player2}. Seu placar (${p1Val}x${p2Val}) é inferior.`
      : null;
  } catch (error) {
    logger.error('[handleConfirm] Failed to refresh floor:', error);
    return null;
  }
}

export function isConfirmationBlocked(args: Pick<ValidationArgs, 'floorValidationError' | 'isSetTrulyCompleted' | 'matchWouldEnd' | 'canAddNextSet' | 'maxSets'>): boolean {
  return Boolean(args.floorValidationError || (args.isSetTrulyCompleted && !args.matchWouldEnd && !args.canAddNextSet && args.maxSets > 1));
}

export function isMatchFinishing(matchWouldEnd: boolean, isSetTrulyCompleted: boolean): boolean {
  return matchWouldEnd && isSetTrulyCompleted;
}

export function getFinalSets(args: FinalSetsArgs): SetEditData[] {
  const finalSets = [...getCompletedSets(args.state, args.completedSets), ...args.state.newSets];
  if (!args.bothFilled) return finalSets;
  finalSets.push(args.createSetEditData({
    p1Val: args.p1Val,
    p2Val: args.p2Val,
    isSetTrulyCompleted: args.isSetTrulyCompleted,
    hasTiebreak: args.hasTiebreak,
    tiebreakP1Num: args.tiebreakP1Num,
    tiebreakP2Num: args.tiebreakP2Num,
    isMatchTiebreakSet: args.isMatchTiebreakSet,
    isPotentialMTSet: args.isPotentialMTSet,
    p1Points: args.state.p1Points,
    p2Points: args.state.p2Points,
    currentSets: args.currentSets,
  }));
  return finalSets;
}

export function getTiebreakInput(p1: number, p2: number, tiebreakP1: number, tiebreakP2: number, isMatchTiebreakSet: boolean) {
  const hasScore = !Number.isNaN(tiebreakP1) && !Number.isNaN(tiebreakP2) && (tiebreakP1 > 0 || tiebreakP2 > 0);
  const score = hasScore ? { player1: tiebreakP1, player2: tiebreakP2 } : null;
  return { hasScore, score: isMatchTiebreakSet ? { player1: p1, player2: p2 } : score };
}

export function getConfirmValidationError(args: ValidationArgs): string | null {
  const blocks = [getBasicValidationBlock(args), getSetValidationBlock(args), getCompletionBlock(args), getPointRegressionError(args)];
  return blocks.find((block) => block !== null) ?? null;
}


type FreshFloorArgs = {
  onRefreshFloor?: (() => Promise<FloorSets | null>) | undefined;
  floorCurrentSets?: FloorSets | null;
  isSetTrulyCompleted: boolean;
  p1Val: number;
  p2Val: number;
};

export async function getConfirmationError(
  freshFloorArgs: FreshFloorArgs,
  validationArgs: ValidationArgs,
): Promise<string | null> {
  if (freshFloorArgs.onRefreshFloor && freshFloorArgs.floorCurrentSets && !freshFloorArgs.isSetTrulyCompleted) {
    const freshError = await getFreshFloorError(
      freshFloorArgs.onRefreshFloor,
      freshFloorArgs.floorCurrentSets,
      freshFloorArgs.isSetTrulyCompleted,
      freshFloorArgs.p1Val,
      freshFloorArgs.p2Val,
    );
    if (freshError) return freshError;
  }
  return getConfirmValidationError(validationArgs);
}

export type { ValidationArgs };


export function shouldRefreshFloor(
  onRefreshFloor: (() => Promise<FloorSets | null>) | undefined,
  floorCurrentSets: FloorSets | null | undefined,
  isSetTrulyCompleted: boolean,
): boolean {
  return Boolean(onRefreshFloor && floorCurrentSets && !isSetTrulyCompleted);
}
