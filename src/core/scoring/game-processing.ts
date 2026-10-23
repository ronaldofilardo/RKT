import type { ScoringEngineConfig, ScoringState } from './types';
import { usesNoAd } from './format-rules';
import { onGameWon } from './game-on-won';
import { applyStandardPoint, applyDeucePoint } from './game-points';

export { onGameWon } from './game-on-won';
export { applyStandardPoint, applyDeucePoint } from './game-points';

export function applyRegularPoint(
  winner: 'player1' | 'player2',
  state: ScoringState,
  config: ScoringEngineConfig,
): ScoringState {
  const game = state.currentGame;
  if (game.isDeuce) {
    // Em formatos "no-ad", a partir do 3-3 o game é decidido no PRÓXIMO
    // ponto (sudden death / ponto de ouro) — quem vencer esse ponto único
    // vence o game, sem precisar de 2 pontos de vantagem. O deuce
    // tradicional (applyDeucePoint) só se aplica a formatos com
    // vantagem.
    if (usesNoAd(config)) return onGameWon(winner, game, state, config);
    return applyDeucePoint(winner, state, config);
  }
  return applyStandardPoint(winner, state, config);
}
