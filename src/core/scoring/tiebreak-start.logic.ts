import type { ScoringEngineConfig, ScoringState, SetScore } from './types';
import { isFinalSet, getGamesToTiebreak } from './format-rules';

export function shouldStartTiebreak(set: SetScore, state: ScoringState, config: ScoringEngineConfig): boolean {
  const isFinalSet_ = isFinalSet(config);

  if (isFinalSet_) {
    const games = getGamesToTiebreak(config);
    return set.player1 === games && set.player2 === games;
  }

  if (config.format === 'BEST_OF_5') {
    // 5º set decisivo (2x2 em sets): joga games normais até 6x6, e SÓ ENTÃO
    // inicia o tie-break — que applyTiebreakPoint trata como Match Tiebreak
    // de 10 pontos por já checar state.sets.length === 5. Antes retornava
    // false aqui, o que impedia o tie-break de começar em 6x6 no 5º set,
    // deixando o set seguir por vantagem indefinidamente (regra errada).
    return set.player1 === 6 && set.player2 === 6;
  }

  if (config.format === 'BEST_OF_3') {
    // BEST_OF_3 (com vantagem, sem Match Tiebreak) usa tie-break normal em
    // TODOS os sets, incluindo o 3º/decisivo — não há MT para substituí-lo.
    return set.player1 === 6 && set.player2 === 6;
  }

  if (
    config.format === 'BEST_OF_3_MATCH_TB' ||
    config.format === 'BEST_OF_3_NO_AD' ||
    config.format === 'SHORT_SET_2V2_NO_AD'
  ) {
    const setsWon = state.setsWon;
    if (state.sets.length >= 2 && setsWon.player1 === 1 && setsWon.player2 === 1) {
      return false;
    }
    return set.player1 === 6 && set.player2 === 6;
  }

  return set.player1 === 6 && set.player2 === 6;
}
