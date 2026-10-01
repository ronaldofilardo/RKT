import type { TennisFormat } from '@/core/scoring/types';
import type { CompletedSet } from './edit-score-logic';
import type { SetEditData } from './editScoreHelpers';
import { validateSetResult } from './editScoreHelpers';
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







export function getFloorError(p1: number, p2: number, floor: FloorSets | null | undefined): string | null {
  if (p1 < (floor?.player1 ?? p1) || p2 < (floor?.player2 ?? p2)) return `Placar não pode ser inferior ao ponto de parada (${floor?.player1}x${floor?.player2}).`;
  return null;
}



// Bug (2026-09-07) — ALTO: determina se um set completado (possivelmente
// editado manualmente pelo usuário via handleEditCompletedSet) tem de fato
// um vencedor definido, ou se é um placar incompleto/inválido (ex.: 5-4)
// que o usuário digitou por engano. `validateSetResult` sozinho não basta
// para sets 6-6: ele sempre retorna "Tiebreak required" (sem vencedor) para
// 6x6, mesmo quando o set JÁ tem um `tiebreakScore` anexado que resolve o
// empate — esse é o formato normal de armazenamento de um set decidido no
// tiebreak neste código (games ficam 6x6, o vencedor vem do tiebreakScore).
function isCompletedSetGenuinelyPartial(
  p1Games: number,
  p2Games: number,
  tiebreakScore: { player1: number; player2: number } | null | undefined,
  matchFormat: TennisFormat,
): boolean {
  const result = validateSetResult({ p1Games, p2Games }, matchFormat);
  if (result.winner) return false;
  if (result.tiebreakRequired && tiebreakScore && tiebreakScore.player1 !== tiebreakScore.player2) {
    return false;
  }
  return true;
}

export function getCompletedSets(state: EditableState, completedSets: CompletedSet[], matchFormat: TennisFormat): SetEditData[] {
  // Always use editableCompletedSets when defined (initialized from props on
  // open). Falling back to `completedSets` when the array is empty discards
  // user removals — Bug #11.
  const source = state.editableCompletedSets ?? completedSets;
  return source.map((set) => {
    const p1Games = 'games' in set ? set.games.player1 : set.p1Games;
    const p2Games = 'games' in set ? set.games.player2 : set.p2Games;
    const tiebreakScore = set.tiebreakScore ?? null;
    // Bug (2026-09-07) — ALTO: antes, `isPartial` era sempre `false` aqui,
    // independente do placar real. Isso permitia que um set completado
    // editado pelo usuário para um placar incompleto (ex.: 5-4, que
    // handleEditCompletedSet aceita sem erro por não ser tecnicamente
    // inválido) fosse enviado a onConfirm/ao backend marcado como um set
    // COMPLETO e vencido por alguém, contaminando o placar da partida.
    return {
      p1Games,
      p2Games,
      isPartial: isCompletedSetGenuinelyPartial(p1Games, p2Games, tiebreakScore, matchFormat),
      ...(tiebreakScore ? { tiebreakScore } : {}),
    };
  });
}

// Bug (2026-09-07): calculateNextServer precisa da mesma fonte de sets
// concluídos que getCompletedSets() usa para o payload de onConfirm —
// caso contrário, editar o placar de um set já finalizado (via
// handleEditCompletedSet) salva o placar certo mas calcula o sacador com
// base no set NÃO editado (prop `completedSets` crua), produzindo um
// sacador incorreto sempre que a edição muda a paridade de games da
// partida. Esta função converte a saída de getCompletedSets (SetEditData[],
// já refletindo editableCompletedSets) para o shape CompletedSet[] que
// calculateNextServer espera.
export function toCompletedSetsForServer(
  state: EditableState,
  completedSets: CompletedSet[],
  matchFormat: TennisFormat,
): CompletedSet[] {
  return getCompletedSets(state, completedSets, matchFormat).map((set) => {
    // Determinar vencedor consultando tiebreakScore quando games estão
    // empatados (6-6 em set regular, ou 1-0/0-1 em MTB puro). Sem isso,
    // p1Games > p2Games resolvia incorretamente para 'player2' em sets
    // decididos por tiebreak com games empatados.
    let winner: 'player1' | 'player2';
    if (set.p1Games > set.p2Games) {
      winner = 'player1';
    } else if (set.p2Games > set.p1Games) {
      winner = 'player2';
    } else if (set.tiebreakScore) {
      winner = set.tiebreakScore.player1 > set.tiebreakScore.player2 ? 'player1' : 'player2';
    } else {
      winner = 'player2';
    }
    return {
      games: { player1: set.p1Games, player2: set.p2Games },
      winner,
      ...(set.tiebreakScore ? { tiebreakScore: set.tiebreakScore } : {}),
    };
  });
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











export type { ValidationArgs };
