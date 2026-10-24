import { logger } from "@/lib/logger";
import { createUndoLastPoint } from "./undo-redo-undo.logic";
import type { UndoRedoDeps } from "./undo-redo.types";

export function createUndoRedoService(deps: UndoRedoDeps) {
  const { debounceTimerRef, isProcessingRef, closeAll, clearFirstServeError, setServeStep, closeServeErrorModal, open } = deps;

  const undoLastPoint = createUndoLastPoint(deps);

  const returnToPreviousScreen = (serveStep: "none" | "second") => {
    if (serveStep === "second") {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
        isProcessingRef.current = false;
      }
      if (isProcessingRef.current) return;
      closeServeErrorModal();
      clearFirstServeError();
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

      const res = await fetch(`/api/matches/${matchId}/point/${pointLogId}/audio`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        throw new Error(`Falha no upload do áudio: HTTP ${res.status}`);
      }
    } catch (err) {
      logger.error("[uploadAudioNote]", err);
      throw err;
    }
  };

  return {
    undoLastPoint,
    returnToPreviousScreen,
    uploadAudioNote,
  };
}

export type { UndoRedoDeps } from "./undo-redo.types";
