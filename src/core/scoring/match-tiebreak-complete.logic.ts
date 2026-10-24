import type { ScoringEngineConfig, ScoringState, SetScore } from './types';

export function completeMatchTiebreak(
  winner: 'player1' | 'player2',
  tbScore: { player1: number; player2: number },
  newServer: 'player1' | 'player2',
  state: ScoringState,
  config?: ScoringEngineConfig,
): ScoringState {
  // Formatos de MT "puro" (o set inteiro nasce como tie-break, ex. MATCH_TB_10,
  // BEST_OF_3_MATCH_TB) começam o set em 0x0 e o vencedor fecha em 1x0.
  // Já o 5º set decisivo do BEST_OF_5 joga games normais até 6x6 antes do
  // tie-break começar — o placar oficial do set deve ser 7x6 (games), não
  // 1x0. baseGames vem do próprio set (6 ou 0, igual para os dois lados,
  // pois só o tiebreakScore mudou até aqui).
  if (state.sets.length <= 1 && config?.format !== 'BEST_OF_5') {
    const setWinnerGames = winner === 'player1' ? 1 : 0;
    const setLoserGames = winner === 'player1' ? 0 : 1;
    state.sets = [{
      player1: setWinnerGames,
      player2: setLoserGames,
      isTiebreak: true,
      tiebreakScore: tbScore,
    }];
    state.setsWon = winner === 'player1' ? { player1: 1, player2: 0 } : { player1: 0, player2: 1 };
    state.isFinished = true;
    state.winner = winner;
    state.server = newServer;
    return state;
  }

  const currentSetIndex = state.sets.length - 1;
  const currentSet = state.sets[currentSetIndex];
  const baseGames = currentSet.player1;
  const completedSet: SetScore = {
    ...currentSet,
    player1: winner === 'player1' ? baseGames + 1 : baseGames,
    player2: winner === 'player2' ? baseGames + 1 : baseGames,
    isTiebreak: true,
    tiebreakScore: tbScore,
  };
  const newSets = [...state.sets];
  newSets[currentSetIndex] = completedSet;

  const setsWon = { ...state.setsWon };
  if (winner === 'player1') setsWon.player1++;
  else setsWon.player2++;

  state.sets = newSets;
  state.setsWon = setsWon;
  state.isFinished = true;
  state.winner = winner;
  state.server = newServer;
  return state;
}
