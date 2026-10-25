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

export function isAcePoint(p: TimelinePoint): boolean {
  return p.type === 'ACE' || p.type === 'SERVICE_ACE';
}

export function isDoubleFaultPoint(p: TimelinePoint): boolean {
  return p.type === 'DOUBLE_FAULT' || p.rallyDetails?.tipo === 'dupla_falta';
}

export function isRallyWinnerPoint(p: TimelinePoint): boolean {
  if (isAcePoint(p)) return false;
  return p.rallyDetails?.tipo === 'winner' || p.type === 'WINNER';
}

export function isForcedErrorPoint(p: TimelinePoint): boolean {
  return p.rallyDetails?.tipo === 'erro_forcado' || p.type === 'FORCED_ERROR';
}

export function isUnforcedErrorPoint(p: TimelinePoint): boolean {
  if (isDoubleFaultPoint(p)) return false;
  return p.rallyDetails?.tipo === 'erro_nao_forcado' || p.type === 'UNFORCED_ERROR';
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
  if (isUnforcedErrorPoint(p)) {
    return 'unforced';
  }
  if (isDoubleFaultPoint(p) && p.server === offenderServer) {
    return 'unforced';
  }
  if (isForcedErrorPoint(p)) {
    return 'forced';
  }
  return null;
}
