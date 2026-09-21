import { logger } from "@/lib/logger";
import type { ScoringState } from "@/core/scoring/types";

export interface UndoRedoDeps {
  engineRef: React.MutableRefObject<any>;
  isOnline?: boolean;
  matchId?: string;
  removeLastAction?: (matchId: string) => Promise<boolean>;
  isProcessingRef: React.MutableRefObject<boolean>;
  debounceTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  lastPointLogIdRef: React.MutableRefObject<string | null>;
  pointSequenceRef: React.MutableRefObject<number>;
  setScoreState: (action: any) => void;
  setPointsHistory: React.Dispatch<React.SetStateAction<string[]>>;
  persistState: (
    state: ScoringState,
    label: string,
    options?: {
      allowScoreEdit?: boolean;
      isManualScoreEdit?: boolean;
      voidPointLogId?: string;
      voidLastPoint?: boolean;
    },
  ) => Promise<{ success: boolean; needsResync?: boolean; errorStatus?: number }>;
  closeAll: () => void;
  handleFirstServeErrorClear: () => void;
  setServeStep: (step: "none" | "second") => void;
  handleServeErrorClose: () => void;
  onUndoComplete?: () => void;
  open: (modal: string, params?: Record<string, string>) => void;
}

export function createUndoRedoService(deps: UndoRedoDeps) {
  const {
    engineRef,
    isOnline,
    matchId,
    removeLastAction,
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
    open,
  } = deps;

  const handleUndo = async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      isProcessingRef.current = false;
      handleFirstServeErrorClear();
      setServeStep("none");
      handleServeErrorClose();
      closeAll();
      return;
    }

    if (!engineRef.current || isProcessingRef.current) return;
    isProcessingRef.current = true;
    try {
      const previousState = engineRef.current.getState();
      const previousHistory = engineRef.current.getPointHistory();
      
      const undone = engineRef.current.undoLastPoint();
      if (!undone) return;

      const newState = engineRef.current.getState() as ScoringState;
      setScoreState({ type: "UNDO", payload: newState });
      setPointsHistory((prev) => prev.slice(0, -1));

      if (isOnline === false && removeLastAction && matchId) {
        const removed = await removeLastAction(matchId);
        if (removed) {
          lastPointLogIdRef.current = null;
          pointSequenceRef.current = Math.max(0, pointSequenceRef.current - 1);
          closeAll();
          onUndoComplete?.();
          return;
        }
      }

      const pointLogIdToVoid = lastPointLogIdRef.current;
      const result = await persistState(newState, "undo", {
        voidPointLogId: pointLogIdToVoid ?? undefined,
        voidLastPoint: !pointLogIdToVoid ? true : undefined,
      });

      if (result.success) {
        lastPointLogIdRef.current = null;
        pointSequenceRef.current = Math.max(0, pointSequenceRef.current - 1);
        closeAll();
        onUndoComplete?.();
      } else if (result.errorStatus && result.errorStatus >= 400 && result.errorStatus < 500) {
        engineRef.current.restorePointHistory(previousHistory);
        engineRef.current.loadState(previousState);
        setScoreState({ type: "EDIT_CONFIRMED", payload: previousState });
        const lastWinner = previousHistory[previousHistory.length - 1]?.point?.winnerId;
        setPointsHistory((prev) => lastWinner ? [...prev, lastWinner] : prev);
        closeAll();
      } else if (result.needsResync) {
        closeAll();
      }
    } finally {
      isProcessingRef.current = false;
    }
  };

  const handleVoltar = (serveStep: "none" | "second") => {
    if (serveStep === "second") {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
        isProcessingRef.current = false;
      }
      if (isProcessingRef.current) return;
      handleServeErrorClose();
      handleFirstServeErrorClear();
      setServeStep("none");
      closeAll();
      return;
    }
    open("undo");
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
      formData.append("file", blob);
      formData.append("durationMs", String(durationMs));

      await fetch(`/api/matches/${matchId}/point/${pointLogId}/audio`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        body: formData,
      });
    } catch (err) {
      logger.error("[uploadAudioNote]", err);
    }
  };

  return {
    handleUndo,
    handleVoltar,
    uploadAudioNote,
  };
}
