import type { ScoringEngineConfig, ScoringState, GameScore } from './types';
import { usesNoAd } from './format-rules';
import { onGameWon } from './game-on-won';

export { onGameWon } from './game-on-won';

/**
 * Ponto em formato "no-ad": ao empatar em 3-3 (40-40) o game NÃO encerra —
 * entra em Ponto Decisivo (Deuce) para ser decidido no próximo ponto único.
 * Caso contrário, quem chegar a 4 pontos vence direto.
 */
function applyNoAdPoint(
  game: GameScore,
  state: ScoringState,
  config: ScoringEngineConfig,
): ScoringState {
  if (game.player1 >= 3 && game.player2 >= 3) {
    game.isDeuce = true;
    game.player1 = 3;
    game.player2 = 3;
    return { ...state, currentGame: game };
  }
  const needed = 4;
  if (game.player1 >= needed || game.player2 >= needed) {
    const gameWinner = game.player1 >= needed ? 'player1' : 'player2';
    return onGameWon(gameWinner, game, state, config);
  }
  return { ...state, currentGame: game };
}

/**
 * Ponto em formato com vantagem (tradicional): 40-40 vira Deuce, precisa de
 * 2 pontos de diferença a partir de 3-3 para fechar o game.
 */
function applyAdvantagePoint(
  game: GameScore,
  state: ScoringState,
  config: ScoringEngineConfig,
): ScoringState {
  if (game.player1 === 3 && game.player2 === 3) {
    game.isDeuce = true;
    return { ...state, currentGame: game };
  }

  if (game.player1 >= 4 && game.player2 < 3) {
    return onGameWon('player1', game, state, config);
  }
  if (game.player2 >= 4 && game.player1 < 3) {
    return onGameWon('player2', game, state, config);
  }

  if (game.player1 >= 3 && game.player2 >= 3) {
    game.isDeuce = true;
    game.player1 = 3;
    game.player2 = 3;
    return { ...state, currentGame: game };
  }

  return { ...state, currentGame: game };
}

function applyStandardPoint(
  winner: 'player1' | 'player2',
  state: ScoringState,
  config: ScoringEngineConfig,
): ScoringState {
  const game = { ...state.currentGame };

  if (winner === 'player1') game.player1++;
  else game.player2++;

  if (usesNoAd(config)) return applyNoAdPoint(game, state, config);
  return applyAdvantagePoint(game, state, config);
}

function applyDeucePoint(
  winner: 'player1' | 'player2',
  state: ScoringState,
  config: ScoringEngineConfig,
): ScoringState {
  const game = { ...state.currentGame };

  if (game.advantage === null) {
    game.advantage = winner;
  } else if (game.advantage === winner) {
    return onGameWon(winner, game, state, config);
  } else {
    game.advantage = null;
  }

  return { ...state, currentGame: game };
}

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
