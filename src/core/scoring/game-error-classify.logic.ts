import type { TimelinePoint } from './types';

export interface GameErrorEntry {
  gameIndex: number; // 1-based (Game 1, Game 2, ...)
  server: 'player1' | 'player2';
  scoreLabel: string; // Ex: "1-0", "1-1"
  isTiebreak: boolean;
  winner: 'player1' | 'player2';
  p1Errors: {
    unforced: number;
    forced: number;
    total: number;
  };
  p2Errors: {
    unforced: number;
    forced: number;
    total: number;
  };
}

/**
 * Classifica o erro cometido num ponto. `offenderServer` é o lado do jogador
 * que PERDEU o ponto (ou seja, cometeu o erro). Dupla falta conta como erro
 * não forçado apenas quando o sacador é o ofensor.
 */
export function classifyPointError(
  p: TimelinePoint,
  offenderServer: 'player1' | 'player2',
): 'unforced' | 'forced' | null {
  const tipo = p.rallyDetails?.tipo;
  if (
    tipo === 'erro_nao_forcado' ||
    p.type === 'UNFORCED_ERROR' ||
    (p.type === 'DOUBLE_FAULT' && p.server === offenderServer)
  ) {
    return 'unforced';
  }
  if (tipo === 'erro_forcado' || p.type === 'FORCED_ERROR') {
    return 'forced';
  }
  return null;
}
