/**
 * Regra pura de cor do MatchCard — domínio de scoring.
 * Exporta funções determinísticas sem dependência de React/UI.
 */

export type MatchCardColorContext = {
  isFinished: boolean;
  isWinnerP1: boolean;
  isWinnerP2: boolean;
  isServerP1: boolean;
  isServerP2: boolean;
};

export type PlayerColor = {
  textColor: string;
  isWinner: boolean;
  isServer: boolean;
};

/**
 * Determina a cor do texto do atleta no card baseado no estado da partida.
 * Regra:
 * - Partida finalizada: vencedor = emerald/volt (negrito), perdedor = muted
 * - Partida ao vivo: sacador = emerald/volt (negrito), outro = primary (negrito)
 */
export function computePlayerColor(
  context: MatchCardColorContext,
  player: 'player1' | 'player2'
): PlayerColor {
  const isFinished = context.isFinished;
  const isWinner = player === 'player1' ? context.isWinnerP1 : context.isWinnerP2;
  const isServer = player === 'player1' ? context.isServerP1 : context.isServerP2;

  if (isFinished) {
    if (isWinner) {
      return {
        textColor: 'text-emerald-800 dark:text-telemetry-volt font-black',
        isWinner: true,
        isServer: false,
      };
    }
    return {
      textColor: 'text-telemetry-text-muted/70 font-normal',
      isWinner: false,
      isServer: false,
    };
  }

  if (isServer) {
    return {
      textColor: 'text-emerald-800 dark:text-telemetry-volt font-black',
      isWinner: false,
      isServer: true,
    };
  }
  return {
    textColor: 'text-telemetry-text-primary font-bold',
    isWinner: false,
    isServer: false,
  };
}

/**
 * Determina a cor do header do set atual.
 */
export function computeSetHeaderColor(isCurrent: boolean): string {
  return isCurrent ? 'font-bold text-telemetry-score-accent' : 'text-telemetry-score-secondary';
}