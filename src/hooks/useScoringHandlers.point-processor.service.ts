import { ScoringEngine } from "@/core/scoring/engine";
import { logger } from "@/lib/logger";
import type { PointFlow, ScoringState, RallyDetails } from "@/core/scoring/types";
import type { MatchData } from "./useScoringHandlers.types";
import type { createPointSyncService } from "./useScoringHandlers.point-sync";

export interface PointProcessorDeps {
  match: MatchData | null;
  isOnline: boolean;
  enqueue: (action: {
    matchId: string;
    type: "POINT";
    payload: any;
    timestamp: number;
  }) => Promise<any>;
  engineRef: React.MutableRefObject<ScoringEngine | null>;
  tokenRef: React.MutableRefObject<string | null>;
  modalParamsRef: React.MutableRefObject<Record<string, string>>;
  pointSequenceRef: React.MutableRefObject<number>;
  matchVersionRef: React.MutableRefObject<number | null>;
  lastPointLogIdRef: React.MutableRefObject<string | null>;
  isProcessingRef: React.MutableRefObject<boolean>;
  serveErrorState: any;
  serverHelpers: {
    getServerId: () => string;
  };
  pointSync: ReturnType<typeof createPointSyncService>;
  closeAll: () => void;
  setScoreState: (action: any) => void;
  setPointsHistory: React.Dispatch<React.SetStateAction<string[]>>;
  setMatch: React.Dispatch<React.SetStateAction<MatchData | null>>;
  setShowFinishedBanner: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  fetchMatch: (forceReset?: boolean) => Promise<void>;
  onPointProcessed?: () => void;
  onAudioUploaded?: () => void;
  uploadAudioNote?: (
    matchId: string,
    pointLogId: string,
    blob: Blob,
    durationMs: number,
    token: string | null,
  ) => Promise<void>;
}

export function createPointProcessorService(deps: PointProcessorDeps) {
  const {
    match,
    isOnline,
    enqueue,
    engineRef,
    tokenRef,
    modalParamsRef,
    pointSequenceRef,
    matchVersionRef,
    lastPointLogIdRef,
    isProcessingRef,
    serveErrorState,
    serverHelpers,
    pointSync,
    closeAll,
    setScoreState,
    setPointsHistory,
    setMatch,
    setShowFinishedBanner,
    setError,
    fetchMatch,
    onPointProcessed,
    onAudioUploaded,
    uploadAudioNote,
  } = deps;

  const applySuccessResult = (
    serverResponse: NonNullable<Awaited<ReturnType<typeof pointSync.syncPointToServer>>["serverResponse"]>,
  ) => {
    const currentHistory = engineRef.current!.getPointHistory();
    const localState = engineRef.current!.getState();
    const rawServerState = serverResponse.scoreState!;
    const isEnvelope = !!(rawServerState as any).state && Array.isArray((rawServerState as any).history);
    const serverState = isEnvelope ? (rawServerState as any).state : rawServerState;
    const historyToRestore = isEnvelope ? (rawServerState as any).history : currentHistory;

    const localInTiebreak = localState.sets?.some((s: any) => s.isTiebreak && s.tiebreakScore);
    const serverHasTiebreak = serverState.sets?.some((s: any) => s.isTiebreak && s.tiebreakScore);

    if (localInTiebreak && !serverHasTiebreak) {
      logger.warn("[processPoint] server response missing tiebreak info — keeping local state", {
        localSets: localState.sets?.length,
        serverSets: serverState.sets?.length,
      });
    } else {
      setScoreState({ type: "POINT_APPLIED", payload: serverState });
      engineRef.current = ScoringEngine.fromSerialized(
        {
          format: match!.format as any,
          player1Id: match!.player1.id,
          player2Id: match!.player2.id,
          initialServerId: match!.initialServerId || match!.player1.id,
        },
        JSON.stringify(serverState),
      );
      engineRef.current.restorePointHistory(historyToRestore);
    }

    if (serverResponse.version !== undefined) {
      matchVersionRef.current = serverResponse.version;
      setMatch((prev) => (prev ? { ...prev, version: serverResponse.version } : prev));
    }

    if (serverResponse.pointLogId) {
      lastPointLogIdRef.current = serverResponse.pointLogId;
    }

    return serverResponse.pointLogId;
  };

  const processPoint = async (flow: PointFlow): Promise<string | undefined> => {
    if (!engineRef.current || !match || isProcessingRef.current) return undefined;
    if (match.state !== "IN_PROGRESS") {
      logger.warn("[processPoint] match.state não é IN_PROGRESS — abortando antes de applyPoint", {
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
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const result = await pointSync.syncPointToServer(flow, seq, clientEventId);

        if (result.success && result.serverResponse?.scoreState) {
          return applySuccessResult(result.serverResponse);
        } else if (result.needsResync) {
          await fetchMatch(true);
          const retrySeq = ++pointSequenceRef.current;
          const retryResult = await pointSync.syncPointToServer(flow, retrySeq, clientEventId);

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
            // reenfileirado na fila offline (mesmo mecanismo usado quando
            // isOnline é false) para ser reenviado automaticamente assim que
            // a rede se estabilizar, em vez de ser perdido definitivamente.
            await pointSync.queuePointForOffline(enqueue, flow);
            setError(
              "Falha ao sincronizar com o servidor — o ponto foi salvo neste dispositivo e será reenviado automaticamente.",
            );
          }
        }
      } else {
        await pointSync.queuePointForOffline(enqueue, flow);
      }

      if (newState.isFinished) setShowFinishedBanner(true);
      return undefined;
    } catch (err) {
      logger.error("[processPoint]", err);
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

  const handlePointDetailsConfirm = (
    details: RallyDetails,
    audio?: { blob: Blob; durationMs: number },
  ) => {
    const winnerSide = modalParamsRef.current.winner as "player1" | "player2";
    const rallyLengthFromModal = modalParamsRef.current.rallyLength;
    if (!match || !winnerSide || isProcessingRef.current) return;

    const rallyLengthToUse = rallyLengthFromModal
      ? parseInt(rallyLengthFromModal, 10) || details.previewBalls
      : details.previewBalls;

    const flowType =
      details.tipo === "winner"
        ? serveErrorState.firstServeError
          ? "ACE"
          : "WINNER"
        : details.tipo === "erro_forcado"
          ? "FORCED_ERROR"
          : "UNFORCED_ERROR";
    const id = winnerSide === "player1" ? match.player1.id : match.player2.id;
    const firstFaultDetail = serveErrorState.firstServeError
      ? {
          errorType: serveErrorState.firstServeError.errorType,
          serveEffect: serveErrorState.firstServeError.serveEffect,
          direction: serveErrorState.firstServeError.direction,
        }
      : undefined;

    closeAll();

    processPoint({
      winnerId: id,
      type: flowType,
      serverId: serverHelpers.getServerId(),
      isFirstServe: serveErrorState.serveStep !== "second" && !serveErrorState.firstServeError,
      isSecondServe: serveErrorState.serveStep === "second" || serveErrorState.firstServeError !== null,
      timestamp: Date.now(),
      rallyDetails: details,
      rallyLength: rallyLengthToUse,
      firstFaultDetail,
    }).then((pointLogId) => {
      if (audio) {
        if (pointLogId && uploadAudioNote) {
          uploadAudioNote(match.id, pointLogId, audio.blob, audio.durationMs, tokenRef.current)
            .then(() => onAudioUploaded?.())
            .catch((err) => {
              logger.error("[handlePointDetailsConfirm] Falha no upload do áudio da nota:", err);
            });
        } else {
          logger.warn(
            "[handlePointDetailsConfirm] Áudio gravado não pôde ser enviado imediatamente (modo offline ou sem pointLogId)",
            { matchId: match.id },
          );
          setError(
            "O ponto foi salvo, mas o áudio da anotação não pôde ser sincronizado no momento (requer conexão ativa).",
          );
        }
      }
    });
  };

  return { processPoint, handlePointDetailsConfirm };
}
