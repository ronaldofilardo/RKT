import type { DoublesArrangement, DoublesConfig } from './types';

/**
 * Deriva um arranjo sugerido a partir da quantidade total de games jogados.
 * Útil para pré-preencher o modal de Edição de Placar.
 */
export function deriveArrangementFromGames(
  totalGames: number,
  initial: DoublesConfig['initial'],
): DoublesArrangement {
  const gamesP1 = Math.ceil(totalGames / 2);
  const gamesP2 = Math.floor(totalGames / 2);

  return {
    serveOrder: {
      player1: [...initial.serveOrder.player1],
      player2: [...initial.serveOrder.player2],
    },
    serveIndex: {
      player1: (gamesP1 % 2) as 0 | 1,
      player2: (gamesP2 % 2) as 0 | 1,
    },
    receiveDeuce: {
      player1: initial.receiveDeuce.player1,
      player2: initial.receiveDeuce.player2,
    },
  };
}

/**
 * Valida a consistência de um arranjo de duplas contra a configuração da partida.
 */
export function validateDoublesArrangement(
  config: DoublesConfig,
  arr: DoublesArrangement,
): boolean {
  if (!arr || !arr.serveOrder || !arr.serveIndex || !arr.receiveDeuce) return false;

  for (const side of ['player1', 'player2'] as const) {
    const expectedMembers = config.members[side];
    const sideOrder = arr.serveOrder[side];
    const sideIndex = arr.serveIndex[side];
    const sideDeuce = arr.receiveDeuce[side];

    if (!Array.isArray(sideOrder) || sideOrder.length !== 2) return false;
    if (sideIndex !== 0 && sideIndex !== 1) return false;
    if (!expectedMembers.includes(sideDeuce)) return false;
    if (!expectedMembers.includes(sideOrder[0]) || !expectedMembers.includes(sideOrder[1])) {
      return false;
    }
    if (sideOrder[0] === sideOrder[1]) return false;
  }

  return true;
}
