import type { MutableRefObject } from 'react';
import type { PointFlow, ScoringState } from '@/core/scoring/types';
import { ScoringEngine } from '@/core/scoring/engine';
import type { MatchData } from './useScoringHandlers';

export function canProcessPoint(
  engineRef: MutableRefObject<ScoringEngine | null>,
  match: MatchData | null,
  isProcessingRef: MutableRefObject<boolean>,
): boolean {
  return Boolean(engineRef.current && match && !isProcessingRef.current && match.state === 'IN_PROGRESS');
}

export function applyLocalPoint(
  engineRef: MutableRefObject<ScoringEngine | null>,
  flow: PointFlow,
  setScoreState: (state: ScoringState) => void,
  setPointsHistory: (updater: (previous: string[]) => string[]) => void,
  pointSequenceRef: MutableRefObject<number>,
): ScoringState | null {
  if (!engineRef.current) return null;
  const state = engineRef.current.getState();
  if (state.isFinished) return null;
  engineRef.current.applyPoint(flow);
  const newState = engineRef.current.getState() as ScoringState;
  setScoreState(newState);
  setPointsHistory((previous) => [...previous.slice(-19), flow.winnerId]);
  pointSequenceRef.current += 1;
  return newState;
}

export function reconcileServerState(
  result: { serverResponse?: { scoreState?: ScoringState; version?: number; pointLogId?: string } },
  match: MatchData,
  engineRef: MutableRefObject<ScoringEngine | null>,
  setScoreState: (state: ScoringState) => void,
  setMatch: (updater: (previous: MatchData | null) => MatchData | null) => void,
): string | undefined {
  const serverState = result.serverResponse?.scoreState;
  if (!serverState || !engineRef.current) return undefined;
  const currentHistory = engineRef.current.getPointHistory();
  setScoreState(serverState);
  engineRef.current = ScoringEngine.fromSerialized(
    {
      format: match.format as any,
      player1Id: match.player1.id,
      player2Id: match.player2.id,
      initialServerId: match.initialServerId || match.player1.id,
    },
    JSON.stringify(serverState),
  );
  engineRef.current.restorePointHistory(currentHistory);
  if (result.serverResponse?.version !== undefined) {
    setMatch((previous) => previous ? { ...previous, version: result.serverResponse!.version } : previous);
  }
  return result.serverResponse?.pointLogId;
}
