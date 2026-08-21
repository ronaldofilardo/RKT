import { logger } from '@/lib/logger';
import type { PointDetails, PointFlow, ScoringEngineConfig } from './types';

export function resolvePointWinner(flow: PointFlow, config: ScoringEngineConfig): 'player1' | 'player2' | null {
  if (flow.type === 'FAULT_FIRST' || flow.firstFault) return null;
  if (flow.winnerId === config.player1Id) return 'player1';
  if (flow.winnerId === config.player2Id) return 'player2';
  logger.error('[ScoringEngine] applyPoint: invalid winnerId', { winnerId: flow.winnerId, player1Id: config.player1Id, player2Id: config.player2Id, type: flow.type });
  throw new Error('INVALID_WINNER');
}

function getPointType(flow: PointFlow): PointDetails['type'] {
  return (flow.type as PointDetails['type']) || 'WINNER';
}

function getPointTiming(flow: PointFlow) {
  return { isFirstServe: flow.isFirstServe ?? true, isSecondServe: flow.isSecondServe ?? false, timestamp: flow.timestamp ?? Date.now() };
}

function getRallyData(flow: PointFlow) {
  return { rallyDetails: flow.rallyDetails ?? null, rallyLength: flow.rallyLength ?? 0, firstFaultDetail: flow.firstFaultDetail ?? null };
}

export function createPointDetails(flow: PointFlow): PointDetails {
  return { winnerId: flow.winnerId, type: getPointType(flow), ...getPointTiming(flow), isLet: false, serverId: flow.serverId, ...getRallyData(flow) };
}

export function isFirstFault(flow: PointFlow): boolean {
  return flow.type === 'FAULT_FIRST' || Boolean(flow.firstFault);
}
