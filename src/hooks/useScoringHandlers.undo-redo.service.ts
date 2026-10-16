import { logger } from "@/lib/logger";
import { type ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState } from "@/core/scoring/types";
import type { ScoreAction } from "@/hooks/useScoreReducer";

interface UndoRedoDeps {
  engineRef: React.MutableRefObject<ScoringEngine | null>;
  isProcessingRef: React.MutableRefObject<boolean>;
  debounceTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  lastPointLogIdRef: React.MutableRefObject<string | null>;
  pointSequenceRef: React.MutableRefObject<number>;
  setScoreState: (action: ScoreAction) => void;
  setPointsHistory: React.Dispatch<React.SetStateAction<string[]>>;
  persistState: (
    state: ScoringState,
    label: string,
    options?: {
      allowScoreEdit?: boolean;
      isManualScoreEdit?: boolean;
      voidPointLogId?: string;
      voidLastPoint?: boolean;
      isUndo?: boolean;
    },
  ) => Promise<{ success: boolean; needsResync?: boolean }>;
  closeAll: () => void;
  clearFirstServeError: () => void;
  setServeStep: (step: "none" | "second") => void;
  closeServeErrorModal: () => void;
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
    clearFirstServeError,
    setServeStep,
    closeServeErrorModal,
    onUndoComplete,
    open,
  } = deps;

  const undoLastPoint = async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      isProcessingRef.current = false;
      clearFirstServeError();
      setServeStep("none");
      closeServeErrorModal();
      closeAll();
      return;
    }

    if (!engineRef.current || isProcessingRef.current) return;
    isProcessingRef.current = true;
    try {
      const undone = engineRef.current.undoLastPoint();
      if (!undone) return;

      // BUG FIX (2026-09-27): antes, quando o ponto desfeito era DOUBLE_FAULT,
      // o código assumia que o engine guardava 2 entradas de histórico para
      // essa jogada (uma FAULT_FIRST + uma DOUBLE_FAULT) e desfazia uma
      // SEGUNDA vez. Essa premissa está obsoleta: hoje o erro de 1º saque
      // nunca gera uma entrada própria no histórico (é só estado local em
      // useScoringHandlers.serve-actions.service.ts); o firstFaultDetail
      // viaja embutido no ÚNICO applyPoint que fecha a jogada, e
      // engine.ts (recordDoubleFault) salva 1 única entrada via
      // saveToHistory. Fazer 2 undos apagava também o ponto anterior
      // (ex.: 15/0 → erro 1º saque + dupla falta → 15/15 → Voltar → 0/0
      // em vez de voltar a 15/0). Agora sempre desfaz exatamente 1 ponto.
      const undoCount = 1;
      const newState = engineRef.current.getState() as ScoringState;
      setScoreState({ type: "UNDO", payload: newState });
      setPointsHistory((prev) => prev.slice(0, -undoCount));

      const pointLogIdToVoid = lastPointLogIdRef.current;
      const result = await persistState(newState, "undo", {
        voidPointLogId: pointLogIdToVoid ?? undefined,
        voidLastPoint: !pointLogIdToVoid,
        isUndo: true,
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
          {
            voidPointLogId: pointLogIdToVoid ?? undefined,
            voidLastPoint: !pointLogIdToVoid,
            isUndo: true,
          },
        );
        lastPointLogIdRef.current = null;
        pointSequenceRef.current = Math.max(0, pointSequenceRef.current - 1);
        closeAll();
      }
    } finally {
      isProcessingRef.current = false;
    }
  };

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
    undoLastPoint,
    returnToPreviousScreen,
    uploadAudioNote,
  };
}
