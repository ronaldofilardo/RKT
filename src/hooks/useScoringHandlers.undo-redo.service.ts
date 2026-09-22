import { logger } from "@/lib/logger";
import type { ScoringState } from "@/core/scoring/types";

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
    options?: {
      allowScoreEdit?: boolean;
      isManualScoreEdit?: boolean;
      voidPointLogId?: string;
    },
  ) => Promise<{ success: boolean; needsResync?: boolean }>;
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
      const undone = engineRef.current.undoLastPoint();
      if (!undone) return;

      const undonePoint = undone.point ?? undone;
      const requestedUndoCount = undonePoint.type === "DOUBLE_FAULT" ? 2 : 1;
      let undoCount = 1;
      for (let index = 1; index < requestedUndoCount; index += 1) {
        if (!engineRef.current.undoLastPoint()) break;
        undoCount += 1;
      }
      const newState = engineRef.current.getState() as ScoringState;
      setScoreState({ type: "UNDO", payload: newState });
      setPointsHistory((prev) => prev.slice(0, -undoCount));

      const pointLogIdToVoid = lastPointLogIdRef.current;
      const result = await persistState(newState, "undo", {
        voidPointLogId: pointLogIdToVoid ?? undefined,
      });

      if (result.success) {
        lastPointLogIdRef.current = null;
        pointSequenceRef.current = Math.max(0, pointSequenceRef.current - 1);
        closeAll();
        onUndoComplete?.();
      } else if (result.needsResync) {
        await persistState(
          engineRef.current?.getState() as ScoringState,
          "undo-retry",
          { voidPointLogId: pointLogIdToVoid ?? undefined },
        );
        lastPointLogIdRef.current = null;
        pointSequenceRef.current = Math.max(0, pointSequenceRef.current - 1);
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
