import { logger } from '@/lib/logger';
import type { FloorSets } from './edit-score-confirm.types';

export function getFloorError(p1: number, p2: number, floor: FloorSets | null | undefined): string | null {
  if (p1 < (floor?.player1 ?? p1) || p2 < (floor?.player2 ?? p2)) return `Placar não pode ser inferior ao ponto de parada (${floor?.player1}x${floor?.player2}).`;
  return null;
}

export async function getFreshFloorError(onRefreshFloor: (() => Promise<FloorSets | null>) | undefined, floorCurrentSets: FloorSets | null | undefined, isSetTrulyCompleted: boolean, p1Val: number, p2Val: number): Promise<string | null> {
  if (!onRefreshFloor || !floorCurrentSets || isSetTrulyCompleted) return null;
  try {
    const freshFloor = await onRefreshFloor();
    return freshFloor && (p1Val < freshFloor.player1 || p2Val < freshFloor.player2)
      ? `Placar atualizado: ${freshFloor.player1}x${freshFloor.player2}. Seu placar (${p1Val}x${p2Val}) é inferior.`
      : null;
  } catch (error) {
    logger.error('[confirmCurrentAction] Failed to refresh floor:', error);
    return null;
  }
}
