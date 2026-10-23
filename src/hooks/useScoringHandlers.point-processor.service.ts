import { logger } from "@/lib/logger";
import type { PointFlow, ScoringState } from "@/core/scoring/types";
import type { PointProcessorDeps } from "./point-processor.types";
import { createApplySuccessResult } from "./point-processor.success.logic";
import { createSyncPointFlow } from "./point-processor.sync.logic";
import { createConfirmPointDetails } from "./point-processor.details.logic";

export function createPointProcessorService(deps: PointProcessorDeps) {
  const {
    match, isOnline, enqueue, engineRef, tokenRef, modalParamsRef, pointSequenceRef,
    matchVersionRef, lastPointLogIdRef, isProcessingRef, serveErrorState, serverHelpers,
    pointSync, closeAll, setScoreState, setPointsHistory, setMatch, setShowFinishedBanner,
    setError, fetchMatch, onPointProcessed, onAudioUploaded, uploadAudioNote,
    clearFirstServeError, setServeStep,
  } = deps;

  const applySuccessResult = createApplySuccessResult({
    engineRef,
    match,
    matchVersionRef,
    lastPointLogIdRef,
    setScoreState,
    setMatch,
  });

  const syncPointFlow = createSyncPointFlow({
    isOnline,
    pointSync,
    enqueue,
    fetchMatch,
    setError,
    pointSequenceRef,
    applySuccessResult,
  });

  const applyPoint = async (flow: PointFlow): Promise<string | undefined> => {
    if (!engineRef.current || !match || isProcessingRef.current) return undefined;
    if (match.state !== "IN_PROGRESS") {
      logger.warn("[applyPoint] match.state não é IN_PROGRESS — abortando antes de applyPoint", {
        matchState: match.state,
        matchId: match.id,
      });
      return undefined;
    }

    isProcessingRef.current = true;

    try {
      const state = engineRef.current.getState();
      if (state.isFinished) {
        isProcessingRef.current = false;
        return undefined;
      }

      engineRef.current.applyPoint(flow);
      const newState = engineRef.current.getState() as ScoringState;
      setScoreState({ type: "POINT_APPLIED", payload: newState });
      setPointsHistory((prev) => [...prev.slice(-19), flow.winnerId]);
      const seq = ++pointSequenceRef.current;
      const synced = await syncPointFlow(flow, seq);
      if (synced.handled) return synced.pointLogId;

      if (newState.isFinished) setShowFinishedBanner(true);
      return undefined;
    } catch (err) {
      logger.error("[applyPoint]", err);
      setError("Erro ao registrar ponto");
      return undefined;
    } finally {
      isProcessingRef.current = false;
      // BUG FIX (ActionBar travada): isProcessingRef é um ref — mutar para
      // false NÃO re-renderiza. Nos caminhos sem setState após o await (fila
      // offline, resposta sem scoreState, tiebreak mismatch), o último render
      // commitado aconteceu com isProcessing=true e todos os botões ficavam
      // travados em ⏳. O bump força re-render para recomputar canUndo e
      // isProcessing a partir dos refs atualizados.
      onPointProcessed?.();
    }
  };

  const confirmPointDetails = createConfirmPointDetails({
    match,
    modalParamsRef,
    serveErrorState,
    serverHelpers,
    closeAll,
    isProcessingRef,
    applyPoint,
    clearFirstServeError,
    setServeStep,
    uploadAudioNote,
    tokenRef,
    onAudioUploaded,
    setError,
  });

  return { applyPoint, confirmPointDetails };
}
