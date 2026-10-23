import type { DoublesConfig, ScoringState, Side, TennisFormat } from './types';
import { courtSide, otherMember } from './doubles-members';

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
