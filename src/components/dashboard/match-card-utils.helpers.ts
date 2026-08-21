import { GAME_POINTS } from '@/core/scoring/point-utils';

export function formatPointValue(value: number | string | undefined, advantage: boolean): string {
  if (advantage) return 'AD';
  const numeric = typeof value === 'number' ? value : 0;
  return GAME_POINTS[Math.min(numeric, 3)] ?? String(value ?? 0);
}

export function getSinglePointValue(
  currentGame: { player1?: number | string; player2?: number | string; advantage?: 'player1' | 'player2' | null } | undefined,
  player: 'player1' | 'player2',
): string {
  const pts = currentGame?.[player] ?? 0;
  return formatPointValue(pts, currentGame?.advantage === player);
}
