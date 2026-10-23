import type { DoublesConfig, ScoringState, Side } from './types';

/**
 * Retorna o lado ('player1' ou 'player2') ao qual um atleta pertence em uma partida de duplas,
 * aceitando tanto o titular quanto o parceiro. Retorna null se não pertencer à partida.
 */
export function sideOfPlayer(config: DoublesConfig, id: string): Side | null {
  if (config.members.player1.includes(id)) return 'player1';
  if (config.members.player2.includes(id)) return 'player2';
  return null;
}

/**
 * Retorna os dois membros da dupla para o lado especificado [titularId, parceiroId].
 */
export function membersOf(config: DoublesConfig, side: Side): [string, string] {
  return config.members[side];
}

/**
 * Retorna o outro membro da mesma dupla dado o id de um dos integrantes.
 */
export function otherMember(config: DoublesConfig, side: Side, id: string): string {
  const [m1, m2] = config.members[side];
  return id === m1 ? m2 : m1;
}

/**
 * Determina o lado da quadra de saque no ponto atual:
 * 'deuce' (quadra de iguais / direita) ou 'ad' (quadra de vantagem / esquerda).
 */
export function courtSide(state: ScoringState): 'deuce' | 'ad' {
  const currentSet = state.sets[state.sets.length - 1];
  const inTiebreak = Boolean(currentSet?.isTiebreak && currentSet?.tiebreakScore);

  if (inTiebreak) {
    const tb = currentSet!.tiebreakScore!;
    const totalPointsPlayed = tb.player1 + tb.player2;
    return totalPointsPlayed % 2 === 0 ? 'deuce' : 'ad';
  }

  const game = state.currentGame;
  if (!game) return 'deuce';

  if (game.isDeuce) {
    // 40-40 (sem vantagem) sempre saca da quadra de iguais
    if (game.advantage === null) return 'deuce';
    // Com vantagem sempre saca da quadra de vantagem
    return 'ad';
  }

  const totalPointsPlayed = (game.player1 || 0) + (game.player2 || 0);
  return totalPointsPlayed % 2 === 0 ? 'deuce' : 'ad';
}

/**
 * Alterna quem da dupla saca no próximo game de serviço dela.
 * Chamado ao final de cada game regular sacado por `servedSide`,
 * ou ao fim do tiebreak (para o lado que abriu o tiebreak).
 */
export function advanceServeIndex(state: ScoringState, servedSide: Side): void {
  if (!state.doubles) return;
  const current = state.doubles.serveIndex[servedSide];
  state.doubles.serveIndex[servedSide] = (current ^ 1) as 0 | 1;
}
