"use client";
import { logger } from "@/lib/logger";
import { TIMEOUTS } from "@/lib/constants";

import { useCallback, useEffect } from "react";
import type {
  ScoringState,
  PointFlow,
  RallyDetails,
  HistoryEntry,
} from "@/core/scoring/types";
import type {
  MatchData,
  ScoringHandlersContext,
  ScoringHandlersReturn,
} from "./useScoringHandlers.types";
import { persistStateWithRetry } from "./useScoringHandlers.persistence";
import { createServerHelpersService } from "./useScoringHandlers.server-helpers.service";
import { createModalHandlersService } from "./useScoringHandlers.modals.service";
import { createPointSyncService } from './useScoringHandlers.point-sync';
import { createFetchMatch } from './useScoringHandlers.fetch-match';
import { createPointDetailsHandler } from './useScoringHandlers.point-details';
import {
  applyLocalPoint,
  canProcessPoint,
  reconcileServerState,
} from './useScoringHandlers.process-point.helpers';

export function useScoringHandlers(ctx: ScoringHandlersContext) {
  const {
    matchId,
    match,
    isOnline,
    enqueue,
    engineRef,
    tokenRef,
    modalParamsRef,
    openRef,
    pointSequenceRef,
    serveErrorState,
    setMatch,
    setScoreState,
    setIsLoading,
    setError,
    setSetupLoading,
    setPointsHistory,
    setShowFinishedBanner,
    handleServeErrorClose,
    handleFirstServeErrorSet,
    handleFirstServeErrorClear,
    setServeStep,
    open,
    close,
    closeAll,
    onUndoComplete,
    isProcessingRef,
    debounceTimerRef,
  } = ctx;

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      isProcessingRef.current = false;
    };
  }, [debounceTimerRef, isProcessingRef]);

  // ─── Match data fetch ──────────────────────────────────────────────────────

  const fetchMatch = useCallback(
    createFetchMatch({
      matchId,
      tokenRef,
      engineRef,
      openRef,
      pointSequenceRef,
      setMatch,
      setScoreState,
      setIsLoading,
      setError,
      setPointsHistory,
    }),
    [matchId, tokenRef, engineRef, openRef, pointSequenceRef, setMatch, setScoreState, setIsLoading, setError, setPointsHistory],
  );

  // ─── State persistence ────────────────────────────────────────────────────
  // FIX Bug 1/4/6: unificado em uma única função. Não chamar de processPoint
  // (o POST /point já persiste com validação de versão + PointLog); usar
  // apenas em undo/let/edit onde não há endpoint dedicado.

  const persistState = useCallback(
    async (
      state: ScoringState,
      label: string,
      persistOptions?: { allowScoreEdit?: boolean; isManualScoreEdit?: boolean }
    ): Promise<{ success: boolean; needsResync?: boolean; conflict?: boolean; version?: number }> => {
      // Tolerante a engines mockados sem getPointHistory (testes). Em produção
      // sempre existe; se ausente, history fica undefined e mantém o legado
      // (somente `state` no snapshot).
      const engineAny = engineRef.current as
        | ({ getPointHistory?: () => HistoryEntry[] } & typeof engineRef.current)
        | null;
      const history = engineAny?.getPointHistory?.();

      const result = await persistStateWithRetry(state, label, {
        matchId,
        match,
        tokenRef,
        setError,
        fetchMatch,
        allowScoreEdit: persistOptions?.allowScoreEdit,
        isManualScoreEdit: persistOptions?.isManualScoreEdit,
        // Em undo/redo o engine mantém o histórico detalhado (com
        // rallyDetails/firstFaultDetail). Persisti-lo aqui evita que o
        // PATCH /state substitua o snapshot anterior e apague os dados do
        // relatório. Em fluxos sem histórico pertinente (ex.: edit-score,
        // que chama engine.loadState e zera o history), history será []
        // e snapshot correspondente gera o mesmo efeito que antes.
        history,
      });

      if (result.success && result.version !== undefined) {
        setMatch((prev) => prev ? { ...prev, version: result.version } : prev);
      }

      return result;
    },
    [matchId, match, tokenRef, setError, fetchMatch, setMatch, engineRef],
  );

  // ─── Services ─────────────────────────────────────────────────────────────
  const serverHelpers = createServerHelpersService({ engineRef, match });
  const modalService = createModalHandlersService({ serveErrorState, open });
  const pointSync = createPointSyncService({ matchId, match, tokenRef, pointSequenceRef, setError });

  // ─── Core point processing ─────────────────────────────────────────────────

  const processPoint = useCallback(
    async (flow: PointFlow): Promise<string | undefined> => {
      if (!canProcessPoint(engineRef, match, isProcessingRef)) return undefined;

      isProcessingRef.current = true;

      try {
        const newState = applyLocalPoint(
          engineRef,
          flow,
          setScoreState,
          setPointsHistory,
          pointSequenceRef,
        );
        if (!newState) return undefined;
        const seq = pointSequenceRef.current;

        if (isOnline) {
          const result = await pointSync.syncPointToServer(flow, seq);

          if (result.success && result.serverResponse?.scoreState) {
            return reconcileServerState(
              result,
              match!,
              engineRef,
              setScoreState,
              setMatch,
            );
          }
          if (result.needsResync) await fetchMatch(true);
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
      }
    },
    [
      match,
      isOnline,
      enqueue,
      engineRef,
      pointSequenceRef,
      setScoreState,
      setPointsHistory,
      setShowFinishedBanner,
      setError,
      fetchMatch,
      pointSync,
      isProcessingRef,
      setMatch,
    ],
  );

  // ─── Setup / serve ─────────────────────────────────────────────────────────

  const handleSetupConfirm = useCallback(
    async (serverId: string) => {
      if (!match) return;
      setSetupLoading(true);
      try {
        const res = await fetch(`/api/matches/${matchId}/state`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${tokenRef.current}`,
          },
          body: JSON.stringify({
            state: "IN_PROGRESS",
            initialServerId: serverId,
          }),
        });
        if (!res.ok) throw new Error();
        close();
        await fetchMatch(true);
      } catch (err) {
        logger.error("[handleSetupConfirm]", err);
        setError("Erro ao iniciar partida");
      } finally {
        setSetupLoading(false);
      }
    },
    [matchId, match, fetchMatch, close, tokenRef, setSetupLoading, setError],
  );

  // ─── Point action handlers ─────────────────────────────────────────────────

  const handleUndo = useCallback(async () => {
    if (!engineRef.current || isProcessingRef.current) return;
    isProcessingRef.current = true;
    try {
      const undone = engineRef.current.undoLastPoint();
      if (!undone) return;
      const newState = engineRef.current.getState() as ScoringState;
      setScoreState(newState);
      setPointsHistory((prev) => prev.slice(0, -1));
      const result = await persistState(newState, "undo");
      if (result.success) {
        closeAll();
        onUndoComplete?.();
      } else if (result.needsResync) {
        const restored =
          (engineRef.current?.getState() as ScoringState | undefined) ?? null;
        if (restored) {
          setScoreState(restored);
        }
        closeAll();
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [
    persistState,
    closeAll,
    engineRef,
    isProcessingRef,
    setScoreState,
    setPointsHistory,
    onUndoComplete,
  ]);

  const handleRedo = useCallback(async () => {
    if (!engineRef.current || isProcessingRef.current) return;
    if (debounceTimerRef.current) return;
    isProcessingRef.current = true;
    try {
      engineRef.current.replayCurrentPoint();
      const newState = engineRef.current.getState() as ScoringState;
      setScoreState(newState);
      const result = await persistState(newState, "redo");
      if (result.success) {
        closeAll();
      } else if (result.needsResync) {
        const restored =
          (engineRef.current?.getState() as ScoringState | undefined) ?? null;
        if (restored) {
          setScoreState(restored);
        }
        closeAll();
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [
    persistState,
    closeAll,
    engineRef,
    isProcessingRef,
    debounceTimerRef,
    setScoreState,
  ]);

  const handleCancelSecondServe = useCallback(() => {
    setServeStep("none");
  }, [setServeStep]);

// ─── Modal openers ─────────────────────────────────────────────────────────

  const openAceModal = useCallback(() => {
    modalService.openAceModal();
  }, [modalService]);

  const openPointDetails = useCallback(
    (side: "player1" | "player2") => {
      modalService.openPointDetails(side);
    },
    [modalService]
  );

  // ─── Serve effect / error confirmation handlers ────────────────────────────

  const handleServerEffectConfirm = useCallback(
    (effect?: string, direction?: string) => {
      if (!match || isProcessingRef.current) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      closeAll();
      const isSecond =
        serveErrorState.serveStep === "second" ||
        serveErrorState.firstServeError !== null;

      const rallyDetails = modalService.createAceRallyDetails(effect, direction);

      debounceTimerRef.current = setTimeout(() => {
        processPoint({
          winnerId: serverHelpers.getWinnerId(true),
          type: "ACE",
          serverId: serverHelpers.getServerId(),
          isFirstServe: !isSecond,
          isSecondServe: isSecond,
          timestamp: Date.now(),
          rallyDetails,
          rallyLength: 1,
        }).catch((err) =>
          logger.error(
            "[handleServerEffectConfirm] Error processing ACE:",
            err
          )
        );
        handleFirstServeErrorClear();
        setServeStep("none");
      }, TIMEOUTS.DEBOUNCE_MS);
    },
    [
      match,
      serveErrorState,
      serverHelpers,
      processPoint,
      handleFirstServeErrorClear,
      setServeStep,
      closeAll,
      modalService,
      debounceTimerRef,
      isProcessingRef,
    ]
  );

  const handleServeErrorConfirm = useCallback(
    (effect?: string, direction?: string) => {
      if (!match || !serveErrorState.pendingServeError || isProcessingRef.current) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (serveErrorState.pendingServeError.serveStep === "first") {
        if (!engineRef.current) return;
        handleFirstServeErrorSet({
          errorType: serveErrorState.pendingServeError.errorType,
          serveEffect: effect,
          direction,
        });
        handleServeErrorClose();
        setServeStep("second");
        closeAll();
      } else {
        const rallyDetails = modalService.createDoubleFaultRallyDetails(
          serveErrorState.pendingServeError.errorType,
          effect,
          direction
        );
        const firstFaultDetail = serveErrorState.firstServeError
          ? {
              errorType: serveErrorState.firstServeError.errorType,
              serveEffect: serveErrorState.firstServeError.serveEffect,
              direction: serveErrorState.firstServeError.direction,
            }
          : undefined;
        closeAll();

        debounceTimerRef.current = setTimeout(() => {
          processPoint({
            winnerId: serverHelpers.getWinnerId(false),
            type: "DOUBLE_FAULT",
            serverId: serverHelpers.getServerId(),
            timestamp: Date.now(),
            rallyDetails,
            rallyLength: 1,
            isFirstServe: false,
            isSecondServe: true,
            firstFaultDetail,
          });
          handleFirstServeErrorClear();
          handleServeErrorClose();
          setServeStep("none");
        }, 50);
      }
    },
    [
      match,
      serveErrorState,
      serverHelpers,
      processPoint,
      handleFirstServeErrorSet,
      handleFirstServeErrorClear,
      handleServeErrorClose,
      setServeStep,
      closeAll,
      engineRef,
      modalService,
      debounceTimerRef,
      isProcessingRef,
    ]
  );

  const handleServeCancel = useCallback(() => {
    handleServeErrorClose();
    if (serveErrorState.firstServeError && engineRef.current) {
      engineRef.current.undoLastPoint();
      setScoreState(engineRef.current.getState() as ScoringState);
    }
    handleFirstServeErrorClear();
  }, [
    handleServeErrorClose,
    serveErrorState.firstServeError,
    engineRef,
    setScoreState,
    handleFirstServeErrorClear,
  ]);

  const handleServeErrorCancel = useCallback(() => {
    closeAll();
    handleServeErrorClose();
    if (serveErrorState.serveStep !== "second") {
      if (serveErrorState.firstServeError && engineRef.current) {
        engineRef.current.undoLastPoint();
        setScoreState(engineRef.current.getState() as ScoringState);
      }
      handleFirstServeErrorClear();
      setServeStep("none");
    }
  }, [
    serveErrorState,
    closeAll,
    handleServeErrorClose,
    handleFirstServeErrorClear,
    setServeStep,
    engineRef,
    setScoreState,
  ]);

  // ─── Audio note upload ────────────────────────────────────────────────────

  const uploadAudioNote = useCallback(
    async (matchId: string, pointLogId: string, blob: Blob, durationMs: number, token: string | null) => {
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
        logger.error("[uploadAudioNote]", err);
      }
    },
    [],
  );

  // ─── Point details ─────────────────────────────────────────────────────────

  const handlePointDetailsConfirm = useCallback(
    createPointDetailsHandler({
      match,
      modalParamsRef,
      isProcessingRef,
      closeAll,
      processPoint,
      getServerId: serverHelpers.getServerId,
      serveStep: serveErrorState.serveStep,
      firstServeError: serveErrorState.firstServeError,
      uploadAudioNote,
      token: tokenRef.current,
    }),
    [match, modalParamsRef, isProcessingRef, closeAll, processPoint, serverHelpers, serveErrorState, uploadAudioNote, tokenRef],
  );

  // ─── Session lifecycle ─────────────────────────────────────────────────────

  // abandonCurrentSession lives in useSessionManager

  return {
    persistState,
    getServerId: serverHelpers.getServerId,
    getWinnerId: serverHelpers.getWinnerId,
    processPoint,
    fetchMatch,
    handleSetupConfirm,
    handleUndo,
    handleRedo,
    handleCancelSecondServe,
    openAceModal,
    openPointDetails,
    handleServerEffectConfirm,
    handleServeErrorConfirm,
    handleServeCancel,
    handleServeErrorCancel,
    handlePointDetailsConfirm,
    isProcessing: isProcessingRef.current,
  };
}

export type { MatchData, ScoringHandlersContext, ScoringHandlersReturn };
