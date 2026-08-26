import type { NormalizedScoreState } from '@/core/scoring/score-normalizer';

type ScoreSet = NormalizedScoreState['sets'][number];
export type ScoreStateLike = {
  setsWon?: { player1: number; player2: number };
  sets?: ScoreSet[];
};

export function resolveSetsWon(normalized: NormalizedScoreState | null, scoreState: ScoreStateLike | null, player: 'player1' | 'player2'): number {
  const explicit = normalized?.setsWon?.[player] ?? scoreState?.setsWon?.[player];
  if (explicit !== undefined) return explicit;
  return scoreState?.sets?.filter((set) => set[player] > set[player === 'player1' ? 'player2' : 'player1']).length ?? 0;
}
