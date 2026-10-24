import type { ScoringState } from './types';

export function isBreakPoint(state: ScoringState): boolean {
  if (!state || state.isFinished) return false;
  const sets = Array.isArray(state.sets) ? state.sets : [];
  const set = sets[sets.length - 1];
  // Tiebreak não tem "quebra de saque" no sentido clássico de game — cada
  // ponto do tiebreak é servido alternadamente, então o conceito de break
  // point não se aplica.
  if (set?.isTiebreak) return false;

  const game = state.currentGame ?? { player1: 0, player2: 0, isDeuce: false, advantage: null };
  const server = state.server;
  const receiver = server === 'player1' ? 'player2' : 'player1';

  // Break point é sobre o placar de PONTOS dentro do game atual — não
  // sobre quantos games já foram vencidos no set. Usar o placar de games
  // resulta em falso-positivo constante: no início de qualquer set/game,
  // ambos têm 0 games, e "receiverGames >= serverGames" é sempre verdadeiro.
  if (game.isDeuce) {
    return game.advantage === receiver;
  }

  const receiverPoints = receiver === 'player1' ? game.player1 : game.player2;
  const serverPoints = server === 'player1' ? game.player1 : game.player2;
  return receiverPoints >= 3 && serverPoints <= 2;
}

export function isGameBall(state: ScoringState): boolean {
  if (!state) return false;
  const game = state.currentGame ?? { player1: 0, player2: 0, isDeuce: false };
  const sets = Array.isArray(state.sets) ? state.sets : [];
  const set = sets[sets.length - 1];
  if (set?.isTiebreak && set.tiebreakScore) {
    const p1 = set.tiebreakScore.player1;
    const p2 = set.tiebreakScore.player2;
    return (p1 >= 9 && p1 - p2 === 1) || (p2 >= 9 && p2 - p1 === 1);
  }
  if (game.isDeuce) return false;
  return (game.player1 >= 3 && game.player2 <= 2) || (game.player2 >= 3 && game.player1 <= 2);
}

export function isSetBall(state: ScoringState, setNumber: number): boolean {
  if (!state) return false;
  const sets = Array.isArray(state.sets) ? state.sets : [];
  const set = sets[setNumber - 1];
  if (!set) return false;
  return (set.player1 >= 5 && set.player2 <= 4) || (set.player2 >= 5 && set.player1 <= 4);
}
