import { logger } from "@/lib/logger";
import type {
  PointFlow,
  RallyDetailsWithAttribution,
  ScoringState,
} from "@/core/scoring/types";
import type { PointProcessorDeps } from "./point-processor.types";
import { createApplySuccessResult } from "./point-processor.success.logic";

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

  const confirmPointDetails = (
    details: RallyDetailsWithAttribution,
    audio?: { blob: Blob; durationMs: number },
  ) => {
    const winnerSide = modalParamsRef.current.winner as "player1" | "player2";
    const rallyLengthFromModal = modalParamsRef.current.rallyLength;
    if (!match || !winnerSide || isProcessingRef.current) return;

    const rallyLengthToUse = rallyLengthFromModal
      ? parseInt(rallyLengthFromModal, 10) || details.previewBalls
      : details.previewBalls;

    const id = winnerSide === "player1" ? match.player1.id : match.player2.id;

    // Regra canônica: um ACE só é registrado direto em /scoring ou via modal de detalhes do saque (ServerEffectModal).
    // Jamais um ACE é cadastrado via detalhes do ponto (PointDetailsModal).
    // Pontos com details.tipo === "winner" em detalhes do ponto são sempre "WINNER".
    const flowType =
      details.tipo === "winner"
        ? "WINNER"
        : details.tipo === "erro_forcado"
          ? "FORCED_ERROR"
          : "UNFORCED_ERROR";
    const firstFaultDetail = serveErrorState.firstServeError
      ? {
          errorType: serveErrorState.firstServeError.errorType,
          serveEffect: serveErrorState.firstServeError.serveEffect,
          direction: serveErrorState.firstServeError.direction,
        }
      : undefined;

    closeAll();

    applyPoint({
      winnerId: id,
      type: flowType,
      serverId: serverHelpers.getServerId(),
      isFirstServe: serveErrorState.serveStep !== "second" && !serveErrorState.firstServeError,
      isSecondServe: serveErrorState.serveStep === "second" || serveErrorState.firstServeError !== null,
      timestamp: Date.now(),
      rallyDetails: details,
      rallyLength: rallyLengthToUse,
      firstFaultDetail,
      hitterId: details.hitterId,
      receiverId: details.receiverId,
    }).then((pointLogId) => {
      clearFirstServeError();
      setServeStep("none");
      
      if (audio) {
        if (pointLogId && uploadAudioNote) {
          uploadAudioNote(match.id, pointLogId, audio.blob, audio.durationMs, tokenRef.current)
            .then(() => onAudioUploaded?.())
            .catch((err) => {
              logger.error("[confirmPointDetails] Falha no upload do áudio da nota:", err);
            });
        } else {
          logger.warn(
            "[confirmPointDetails] Áudio gravado não pôde ser enviado imediatamente (modo offline ou sem pointLogId)",
            { matchId: match.id },
          );
          setError(
            "O ponto foi salvo, mas o áudio da anotação não pôde ser sincronizado no momento (requer conexão ativa).",
          );
        }
      }
    });
  };

  return { applyPoint, confirmPointDetails };
}
