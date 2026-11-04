import type { ScoringEngineConfig, ScoringState, Side } from './types';
import { getServingMemberId } from './doubles-serving';
import { sideOfPlayer } from './doubles-members';

function resolveServerSide(config: ScoringEngineConfig, serverId: string): Side {
  if (config.doubles) {
    const side = sideOfPlayer(config.doubles, serverId);
    if (side) return side;
    throw new Error('INVALID_SERVER');
  }
  if (serverId === config.player1Id) return 'player1';
  if (serverId === config.player2Id) return 'player2';
  throw new Error('INVALID_SERVER');
}

function toggleServeIndex(state: ScoringState, side: Side): void {
  const arr = state.doubles!;
  arr.serveIndex[side] = (arr.serveIndex[side] ^ 1) as 0 | 1;
}

function swapServeOrder(state: ScoringState, side: Side): void {
  const arr = state.doubles!;
  const [first, second] = arr.serveOrder[side];
  arr.serveOrder[side] = [second, first];
}

/**
 * Corrige o sacador ativo do game atual (Simples ou Duplas) sem alterar o
 * placar nem o histórico de pontos. Em Duplas, ajusta `serveIndex`/`serveOrder`
 * até `getServingMemberId` devolver o atleta informado; em Simples basta
 * alternar o lado (`state.server`).
 */
export function applyGameServerChange(
  state: ScoringState,
  config: ScoringEngineConfig,
  serverId: string,
): ScoringState {
  if (state.isFinished) throw new Error('MATCH_ALREADY_FINISHED');

  const side = resolveServerSide(config, serverId);
  state.server = side;
  if (!config.doubles || !state.doubles) return state;

  for (let attempt = 0; attempt < 4; attempt++) {
    if (getServingMemberId(state, config.doubles) === serverId) return state;
    if (attempt % 2 === 0) toggleServeIndex(state, side);
    else swapServeOrder(state, side);
  }
  throw new Error('INVALID_SERVER');
}
