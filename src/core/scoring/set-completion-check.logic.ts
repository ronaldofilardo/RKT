import type { ScoringEngineConfig, SetScore } from './types';
import { isTiebreakComplete, getRequiredGamesToWinSet } from './set-completion-rules.logic';

export function isSetComplete(
  set: SetScore,
  _setsWon: { player1: number; player2: number },
  config: ScoringEngineConfig,
  sets: SetScore[],
): boolean {
  if (set.isTiebreak && set.tiebreakScore) {
    return isTiebreakComplete(set.tiebreakScore, config.format, sets.length);
  }

  // Se o set tem tiebreakScore, mas isTiebreak=false, ele foi decidido por tiebreak e já concluído.
  // Nesse caso, o vencedor tem 1 game de vantagem (ex: 7-6).
  if (!set.isTiebreak && set.tiebreakScore) {
    const diff = Math.abs(set.player1 - set.player2);
    const needed = getRequiredGamesToWinSet(config);
    const maxGames = Math.max(set.player1, set.player2);
    if (diff === 1 && maxGames === needed + 1) {
      return true;
    }
  }

  const diff = Math.abs(set.player1 - set.player2);
  const maxGames = Math.max(set.player1, set.player2);
  const needed = getRequiredGamesToWinSet(config);

  return maxGames >= needed && diff >= 2;
}
