import type { ScoringState, SetScore } from './types';

type PlayerSide = 'player1' | 'player2';

function oppositePlayer(player: PlayerSide): PlayerSide {
  return player === 'player1' ? 'player2' : 'player1';
}

function scoreForPlayer(game: ScoringState['currentGame'], player: PlayerSide): number {
  return player === 'player1' ? game.player1 : game.player2;
}

export function getBreakPointPlayers(state: ScoringState): { server: PlayerSide; receiver: PlayerSide } {
  const server = state.server;
  return { server, receiver: oppositePlayer(server) };
}

export function isDeuceBreakPoint(state: ScoringState, receiver: PlayerSide): boolean {
  return state.currentGame.isDeuce && state.currentGame.advantage === receiver;
}

export function isPointsBreakPoint(state: ScoringState, server: PlayerSide, receiver: PlayerSide): boolean {
  const game = state.currentGame;
  if (game.player1 === 0 && game.player2 === 0) return false;
  const receiverPoints = scoreForPlayer(game, receiver);
  const serverPoints = scoreForPlayer(game, server);
  return receiverPoints >= 3 && serverPoints <= 2;
}

export function isGamesBreakPoint(set: SetScore, server: PlayerSide, receiver: PlayerSide): boolean {
  const receiverGames = server === 'player1' ? set.player2 : set.player1;
  const serverGames = server === 'player1' ? set.player1 : set.player2;
  return receiver === oppositePlayer(server) && receiverGames > 0 && receiverGames >= serverGames;
}

export function getCurrentSet(state: ScoringState): SetScore | undefined {
  return state.sets[state.sets.length - 1];
}

export function hasBreakPointScore(state: ScoringState, set: SetScore): boolean {
  const { server, receiver } = getBreakPointPlayers(state);
  if (state.currentGame.isDeuce) return isDeuceBreakPoint(state, receiver);
  if (state.currentGame.player1 !== 0 || state.currentGame.player2 !== 0) {
    return isPointsBreakPoint(state, server, receiver);
  }
  return isGamesBreakPoint(set, server, receiver);
}
