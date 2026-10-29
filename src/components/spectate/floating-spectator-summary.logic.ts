import type { SpectatorScore } from '@/core/spectate/types';

/** Resumo curto do placar para a pílula minimizada. Ex.: "6-4 3-2 40-30". */
export function summarizeScore(score: SpectatorScore, finished: boolean): string {
  const sets = score.sets.map((s) => `${s.player1}-${s.player2}`).join(' ');
  if (finished) return sets;
  return `${sets} ${score.currentGame.player1}-${score.currentGame.player2}`.trim();
}
