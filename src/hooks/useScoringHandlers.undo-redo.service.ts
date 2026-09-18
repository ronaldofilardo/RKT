import { logger } from '@/lib/logger';
import type { ScoringState } from '@/core/scoring/types';

export interface UndoRedoDeps {
  engineRef: React.MutableRefObject<any>;
  isProcessingRef: React.MutableRefObject<boolean>;
  debounceTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  lastPointLogIdRef: React.MutableRefObject<string | null>;
  pointSequenceRef: React.MutableRefObject<number>;
  setScoreState: (action: any) => void;
  setPointsHistory: React.Dispatch<React.SetStateAction<string[]>>;
  persistState: (
    state: ScoringState,
    label: string,
    options?: { allowScoreEdit?: boolean; isManualScoreEdit?: boolean; voidPointLogId?: string },
  ) => Promise<{ success: boolean; needsResync?: boolean }>;
  closeAll: () => void;
  handleFirstServeErrorClear: () => void;
  setServeStep: (step: 'none' | 'second') => void;
  handleServeErrorClose: () => void;
  onUndoComplete?: () => void;
}

export function createUndoRedoService(deps: UndoRedoDeps) {
  const {
    engineRef,
    isProcessingRef,
    debounceTimerRef,
    lastPointLogIdRef,
    pointSequenceRef,
    setScoreState,
    setPointsHistory,
    persistState,
    closeAll,
    handleFirstServeErrorClear,
    setServeStep,
    handleServeErrorClose,
    onUndoComplete,
  } = deps;

  const handleUndo = async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      isProcessingRef.current = false;
      handleFirstServeErrorClear();
      setServeStep('none');
      handleServeErrorClose();
      closeAll();
      return;
    }

    if (!engineRef.current || isProcessingRef.current) return;
    isProcessingRef.current = true;
    try {
      const undone = engineRef.current.undoLastPoint();
      if (!undone) return;
      const newState = engineRef.current.getState() as ScoringState;
      setScoreState({ type: 'UNDO', payload: newState });
      setPointsHistory((prev) => prev.slice(0, -1));

      const pointLogIdToVoid = lastPointLogIdRef.current;
      const result = await persistState(newState, 'undo', {
        voidPointLogId: pointLogIdToVoid ?? undefined,
      });

      if (result.success) {
        lastPointLogIdRef.current = null;
        pointSequenceRef.current = Math.max(0, pointSequenceRef.current - 1);
        closeAll();
        onUndoComplete?.();
      } else if (result.needsResync) {
        const retryResult = await persistState(
          engineRef.current?.getState() as ScoringState,
          'undo-retry',
          { voidPointLogId: pointLogIdToVoid ?? undefined },
        );
        if (retryResult.success) {
          lastPointLogIdRef.current = null;
          pointSequenceRef.current = Math.max(0, pointSequenceRef.current - 1);
        }
        closeAll();
      }
    } finally {
      isProcessingRef.current = false;
    }
  };

  const handleRedo = async () => {
    if (!engineRef.current || isProcessingRef.current) return;
    if (debounceTimerRef.current) return;
    isProcessingRef.current = true;
    try {
      const redone = engineRef.current.replayCurrentPoint();
      if (!redone) return;
      const newState = engineRef.current.getState() as ScoringState;
      setScoreState({ type: 'REDO', payload: newState });
      setPointsHistory((prev) => [...prev, redone.point.winnerId]);
      const result = await persistState(newState, 'redo');
      if (result.success) {
        closeAll();
      } else if (result.needsResync) {
        const restored = (engineRef.current?.getState() as ScoringState | undefined) ?? null;
        if (restored) {
          setScoreState({ type: 'RESYNCED_FROM_SERVER', payload: restored });
        }
        closeAll();
      }
    } finally {
      isProcessingRef.current = false;
    }
  };

  const uploadAudioNote = async (
    matchId: string,
    pointLogId: string,
    blob: Blob,
    durationMs: number,
    token: string | null,
  ) => {
    try {
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('durationMs', String(durationMs));

      await fetch(`/api/matches/${matchId}/point/${pointLogId}/audio`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        body: formData,
      });
    } catch (err) {
      logger.error('[uploadAudioNote]', err);
    }
  };

  return {
    handleUndo,
    handleRedo,
    uploadAudioNote,
  };
}
