import { parsePointValue, pointToProgress } from '@/core/scoring/point.logic';

export interface GamePointsFloorParams {
  p1Val: number;
  p2Val: number;
  floorCurrentSets?: { player1: number; player2: number } | null;
  currentGamePoints?: { player1: number | string; player2: number | string } | null;
}

export interface GamePointsMinProgress {
  minP1: number;
  minP2: number;
}

/**
 * Calcula o índice de progresso mínimo (0 a 4) permitido para cada jogador.
 * Se os games atuais forem iguais ao piso da partida interrompida, os pontos
 * não podem regredir. Se o set aumentar (ex: de 0x1 para 1x1), os pontos
 * são liberados a partir de 0-0.
 */
export function computeGamePointsMinProgress({
  p1Val,
  p2Val,
  floorCurrentSets,
  currentGamePoints,
}: GamePointsFloorParams): GamePointsMinProgress {
  if (!floorCurrentSets || !currentGamePoints) {
    return { minP1: 0, minP2: 0 };
  }

  const isSameGameAsFloor =
    p1Val === floorCurrentSets.player1 && p2Val === floorCurrentSets.player2;

  if (!isSameGameAsFloor) {
    return { minP1: 0, minP2: 0 };
  }

  return {
    minP1: pointToProgress(parsePointValue(currentGamePoints.player1)),
    minP2: pointToProgress(parsePointValue(currentGamePoints.player2)),
  };
}
