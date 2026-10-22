import type {
  DoublesArrangement,
  DoublesConfig,
  ScoringState,
  Side,
  TennisFormat,
} from './types';

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
 * Determina o atleta específico da dupla sacadora que está no saque para o ponto atual.
 * Trata games normais e rotação de tiebreak (1-depois-2-2-2 entre os 4 atletas).
 */
export function getServingMemberId(state: ScoringState, config: DoublesConfig): string {
  const arrangement = state.doubles;
  if (!arrangement) {
    // Fallback: se arrangement não existir, usa o primeiro da ordem inicial
    return config.initial.serveOrder[state.server][0];
  }

  const currentSet = state.sets[state.sets.length - 1];
  const inTiebreak = Boolean(currentSet?.isTiebreak && currentSet?.tiebreakScore);

  if (inTiebreak) {
    const tb = currentSet!.tiebreakScore!;
    const t = tb.player1 + tb.player2; // Pontos jogados até agora
    const b = Math.floor((t + 1) / 2); // Índice do bloco de saque (0, 1, 2, 3...)

    // s0 = lado que abriu o tiebreak (no bloco 0, t=0, state.server é s0)
    const s0: Side = (b % 2 === 0)
      ? state.server
      : (state.server === 'player1' ? 'player2' : 'player1');
    const s1: Side = s0 === 'player1' ? 'player2' : 'player1';

    if (state.server === s0) {
      const idx = arrangement.serveIndex?.[s0] ?? 0;
      const memberIdx = ((idx + Math.floor(b / 2)) % 2) as 0 | 1;
      return arrangement.serveOrder[s0][memberIdx];
    } else {
      const idx = arrangement.serveIndex?.[s1] ?? 0;
      const memberIdx = ((idx + Math.floor((b - 1) / 2)) % 2) as 0 | 1;
      return arrangement.serveOrder[s1][memberIdx];
    }
  }

  // Game regular
  const serveIdx = arrangement.serveIndex?.[state.server] ?? 0;
  return arrangement.serveOrder[state.server][serveIdx];
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

/**
 * Determina quem da dupla receptora recebe o saque no ponto atual,
 * baseado na quadra (deuce/ad) e na configuração da dupla receptora.
 * Se override for fornecido (ex.: ponto decisivo no-ad), valida e aplica.
 */
export function getReceiverMemberId(
  state: ScoringState,
  config: DoublesConfig,
  override?: string,
): string {
  const receivingSide: Side = state.server === 'player1' ? 'player2' : 'player1';
  const members = config.members[receivingSide];

  if (override && members.includes(override)) {
    return override;
  }

  const side = courtSide(state);
  const receiveDeuceMember = state.doubles?.receiveDeuce[receivingSide] ?? config.initial.receiveDeuce[receivingSide];

  if (side === 'deuce') {
    return receiveDeuceMember;
  }

  return otherMember(config, receivingSide, receiveDeuceMember);
}

/**
 * Verifica se o ponto atual é o ponto decisivo de um game no formato no-ad
 * (ex.: 40-40 onde quem fizer o próximo ponto ganha o game).
 */
export function isNoAdDecidingPoint(state: ScoringState, format: TennisFormat): boolean {
  if (!format.includes('NO_AD')) return false;

  const currentSet = state.sets[state.sets.length - 1];
  if (currentSet?.isTiebreak) return false;

  const game = state.currentGame;
  if (!game) return false;

  if (game.isDeuce) return true;
  return game.player1 >= 3 && game.player2 >= 3;
}

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
