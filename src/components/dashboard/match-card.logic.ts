// Re-exporta a versão unificada do normalizer (bug #4, 2026-08-07).
// Mantemos a assinatura pública deste módulo para não quebrar importadores
// existentes, mas a implementação agora delega para src/core/scoring/score-normalizer
// (que cobre também BEST_OF_5, BEST_OF_3_NO_AD e SHORT_SET_2V2_NO_AD).

export type {
  TennisFormat,
  NormalizedScoreState,
  SetCellScore,
} from './match-card.types';

export {
  formatSetScore,
  formatGamePoints,
  getSinglePointDisplay,
  getLastSetPointDisplay,
  formatCompactSetScore,
} from './match-card-display.logic';

export {
  isMatchTiebreakFormat,
  isSetIndexMatchTiebreak,
  isCurrentSetMatchTiebreak,
  normalizeScoreState,
} from './match-card-tiebreak.logic';
