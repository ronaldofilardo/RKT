import { useCallback, useRef } from 'react';
import type { ScoringEngine } from '@/core/scoring/engine';
import type { PointFlow, ScoringState } from '@/core/scoring/types';
import type { PointFlowInput } from '@/schemas/contracts';

type Props = {
  engine: ScoringEngine;
  matchId: string;
  isOnline: boolean;
  enqueue: (action: { matchId: string; type: 'POINT'; payload: PointFlowInput; timestamp: number }) => Promise<unknown>;
  onSyncError?: (error: Error) => void;
  setScoreState: (state: ScoringState) => void;
  setIsSyncing: (value: boolean) => void;
  setPendingActions: (update: (previous: number) => number) => void;
};

export function useApplyMatchPoint({ engine, matchId, isOnline, enqueue, onSyncError, setScoreState, setIsSyncing, setPendingActions }: Props) {
  const isProcessingRef = useRef(false);

  return useCallback(async (pointFlow: Omit<PointFlowInput, 'timestamp'>) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const point = { ...pointFlow, timestamp: Date.now() } as PointFlowInput;
    try {
      const newState = engine.applyPoint(point as PointFlow);
      setScoreState(newState);
      if (isOnline) {
        await syncOnline(point, matchId, enqueue, setScoreState, setIsSyncing, setPendingActions, onSyncError);
      } else {
        await enqueuePoint(point, matchId, enqueue);
        setPendingActions((previous) => previous + 1);
      }
    } catch (error) {
      onSyncError?.(error as Error);
      throw error;
    } finally {
      isProcessingRef.current = false;
    }
  }, [engine, matchId, isOnline, enqueue, onSyncError, setScoreState, setIsSyncing, setPendingActions]);
}

async function enqueuePoint(point: PointFlowInput, matchId: string, enqueue: Props['enqueue']) {
  await enqueue({ matchId, type: 'POINT', payload: point, timestamp: point.timestamp! });
}

async function syncOnline(
  point: PointFlowInput,
  matchId: string,
  enqueue: Props['enqueue'],
  setScoreState: Props['setScoreState'],
  setIsSyncing: Props['setIsSyncing'],
  setPendingActions: Props['setPendingActions'],
  onSyncError?: Props['onSyncError'],
) {
  setIsSyncing(true);
  try {
    const token = sessionStorage.getItem('access_token');
    const response = await fetch(`/api/matches/${matchId}/point`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(point),
    });
    if (!response.ok) throw new Error('Failed to sync point');
    const result = await response.json() as { scoreState: ScoringState };
    setScoreState(result.scoreState);
  } catch (error) {
    await enqueuePoint(point, matchId, enqueue);
    setPendingActions((previous) => previous + 1);
    onSyncError?.(error as Error);
  } finally {
    setIsSyncing(false);
  }
}
