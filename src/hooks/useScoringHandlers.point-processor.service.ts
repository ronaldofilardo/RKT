import { logger } from "@/lib/logger";
import type {
  PointFlow,
  ScoringState,
} from "@/core/scoring/types";
import type { PointProcessorDeps } from "./point-processor.types";
import { createApplySuccessResult } from "./point-processor.success.logic";
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

      if (isOnline) {
        const clientEventId =
          flow.clientEventId ??
          (typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
        const flowWithClientEventId: PointFlow = { ...flow, clientEventId };
        const result = await pointSync.syncPointToServer(flowWithClientEventId, seq, clientEventId);

        if (result.success && result.serverResponse?.scoreState) {
          return applySuccessResult(result.serverResponse);
        } else if (result.needsLogin) {
          // 401 - token expirado: não tenta novamente, apenas enfileira para offline
          // e mostra mensagem para o usuário fazer login novamente
          await pointSync.queuePointForOffline(enqueue, flowWithClientEventId);
          // O erro já foi setado pelo respondUnauthorized
        } else if (result.needsResync) {
          await fetchMatch(true);
          const retrySeq = ++pointSequenceRef.current;
          const retryResult = await pointSync.syncPointToServer(flowWithClientEventId, retrySeq, clientEventId);

          if (retryResult.success && retryResult.serverResponse?.scoreState) {
            setError(null);
            return applySuccessResult(retryResult.serverResponse);
          } else if (retryResult.needsResync) {
            await fetchMatch(true);
            // BUG FIX (perda silenciosa de anotação ACE/dupla falta/rally):
            // antes, quando as 2 tentativas online falhavam, o ponto (já
            // aplicado localmente, incluindo rallyDetails/firstFaultDetail)
            // era simplesmente descartado — fetchMatch(true) sobrescrevia o
            // estado local com o do servidor (sem o ponto) e não havia
            // nenhuma outra tentativa de reenvio. Agora o ponto é
            // reenfileirado na fila offline com o mesmo clientEventId para
            // garantir idempotência e evitar duplicação no reenvio.
            await pointSync.queuePointForOffline(enqueue, flowWithClientEventId);
            setError(
              "Falha ao sincronizar com o servidor — o ponto foi salvo neste dispositivo e será reenviado automaticamente.",
            );
          } else if (retryResult.needsLogin) {
            // 401 no retry: enfileira para offline
            await pointSync.queuePointForOffline(enqueue, flowWithClientEventId);
          }
        }
      } else {
        const offlineClientEventId =
          flow.clientEventId ??
          (typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
        await pointSync.queuePointForOffline(enqueue, { ...flow, clientEventId: offlineClientEventId });
      }

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
