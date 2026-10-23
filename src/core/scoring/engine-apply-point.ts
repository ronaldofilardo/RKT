import type { ScoringEngineConfig, ScoringState, PointFlow, HistoryEntry } from './types';
import { logger } from '@/lib/logger';
import { saveToHistory } from './engine.history';
import {
  applyRegularPoint as applyRegularPointFlow,
  applyTiebreakPoint as applyTiebreakPointToGame,
  applyMatchTiebreak as applyMatchTiebreakFlow,
  isMatchTiebreakActive,
} from './engine.flow';
import { buildPointDetails } from './engine-point-details';
import { sideOfPlayer } from './doubles';

function resolveWinner(
  flow: PointFlow,
  config: ScoringEngineConfig,
  isFaultFirst: boolean,
): 'player1' | 'player2' {
  if (isFaultFirst) {
    return 'player1';
  }
  if (flow.winnerId === config.player1Id) return 'player1';
  if (flow.winnerId === config.player2Id) return 'player2';

  if (config.doubles) {
    const side = sideOfPlayer(config.doubles, flow.winnerId);
    if (side) return side;
  }

  logger.error('[ScoringEngine] applyPoint: invalid winnerId', {
    winnerId: flow.winnerId,
    player1Id: config.player1Id,
    player2Id: config.player2Id,
    type: flow.type,
  });
  throw new Error('INVALID_WINNER');
}

function applyResolvedPoint(
  state: ScoringState,
  config: ScoringEngineConfig,
  winner: 'player1' | 'player2',
): ScoringState {
  state.secondServe = false;
  state.currentGame.secondServe = false;

  if (isMatchTiebreakActive(state, config)) {
    return applyMatchTiebreakFlow(winner, state, config);
  }

  const currentSet = state.sets[state.sets.length - 1];
  if (currentSet?.isTiebreak) {
    return applyTiebreakPointToGame(state, winner, config);
  }

  return applyRegularPointFlow(winner, state, config);
}

export function processPointFlow(
  config: ScoringEngineConfig,
  state: ScoringState,
  history: HistoryEntry[],
  flow: PointFlow,
): ScoringState {
  const isFaultFirst = Boolean(flow.type === 'FAULT_FIRST' || flow.firstFault);
  const winner = resolveWinner(flow, config, isFaultFirst);
  const isSecondServeState = Boolean(state.secondServe || state.currentGame?.secondServe);
  const details = buildPointDetails(flow, state, config, isSecondServeState);

  if (flow.type === 'DOUBLE_FAULT') {
    saveToHistory(history, state, details);
    state.secondServe = false;
    state.currentGame.secondServe = false;
    return applyResolvedPoint(state, config, winner);
  }

  if (isFaultFirst) {
    saveToHistory(history, state, details);
    state.currentGame.secondServe = true;
    state.secondServe = true;
    return state;
  }

  saveToHistory(history, state, details);
  return applyResolvedPoint(state, config, winner);
}
