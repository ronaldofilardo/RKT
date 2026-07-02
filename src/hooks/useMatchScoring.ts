'use client';

import { useState, useCallback, useEffect } from 'react';
import { useOfflineSync } from './useOfflineSync';
import { ScoringEngine } from '@/core/scoring/engine';
import type { ScoringState, PointFlow } from '@/core/scoring/types';
import type { MatchFormat, PointFlowInput, Match } from '@/schemas/contracts';

interface UseMatchScoringOptions {
  matchId: string;
  format: MatchFormat;
  player1Id: string;
  player2Id: string;
  initialServerId: string;
  initialScoreState?: ScoringState;
  onSyncError?: (error: Error) => void;
}

export function useMatchScoring({
  matchId,
  format,
  player1Id,
  player2Id,
  initialServerId,
  initialScoreState,
  onSyncError,
}: UseMatchScoringOptions) {
  const { enqueue, isOnline } = useOfflineSync();
  const [engine] = useState(() => {
    if (initialScoreState) {
      return ScoringEngine.fromSerialized(
        { format, player1Id, player2Id, initialServerId },
        JSON.stringify(initialScoreState)
      );
    }
    return new ScoringEngine({ format, player1Id, player2Id, initialServerId });
  });

  const [scoreState, setScoreState] = useState<ScoringState>(() => {
    if (initialScoreState) return initialScoreState;
    return engine.getState();
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingActions, setPendingActions] = useState<number>(0);

  const applyPoint = useCallback(async (pointFlow: Omit<PointFlowInput, 'timestamp'>) => {
    const pointFlowWithTimestamp: PointFlowInput = {
      ...pointFlow,
      timestamp: Date.now(),
    };

    try {
      const newState = engine.applyPoint(pointFlowWithTimestamp as PointFlow);
      setScoreState(newState);

      if (isOnline) {
        setIsSyncing(true);
        try {
          const token = sessionStorage.getItem('access_token');
          const response = await fetch(`/api/matches/${matchId}/point`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(pointFlowWithTimestamp),
          });

          if (!response.ok) {
            throw new Error('Failed to sync point');
          }

          const result = await response.json();
          setScoreState(result.scoreState);
        } catch (error) {
          await enqueue({
            matchId,
            type: 'POINT',
            payload: pointFlowWithTimestamp,
            timestamp: pointFlowWithTimestamp.timestamp!,
          });
          setPendingActions((prev) => prev + 1);
          if (onSyncError) onSyncError(error as Error);
        } finally {
          setIsSyncing(false);
        }
      } else {
        await enqueue({
          matchId,
          type: 'POINT',
          payload: pointFlowWithTimestamp,
          timestamp: pointFlowWithTimestamp.timestamp!,
        });
        setPendingActions((prev) => prev + 1);
      }
    } catch (error) {
      if (onSyncError) onSyncError(error as Error);
      throw error;
    }
  }, [engine, matchId, isOnline, enqueue, onSyncError]);

  const refreshScoreState = useCallback(() => {
    setScoreState(engine.getState());
  }, [engine]);

  useEffect(() => {
    const handleSyncComplete = () => {
      setPendingActions(0);
      refreshScoreState();
    };

    window.addEventListener('offline-sync-complete', handleSyncComplete);
    return () => {
      window.removeEventListener('offline-sync-complete', handleSyncComplete);
    };
  }, [refreshScoreState]);

  return {
    scoreState,
    isSyncing,
    isOnline,
    pendingActions,
    applyPoint,
    refreshScoreState,
  };
}