"use client";
import { logger } from "@/lib/logger";
import { useCallback, useEffect, useRef } from "react";
import type { ScoringState, PointFlow, HistoryEntry } from "@/core/scoring/types";
import type { MatchData, ScoringHandlersContext, ScoringHandlersReturn } from "./useScoringHandlers.types";
import { persistStateWithRetry } from "./useScoringHandlers.persistence";
import { createServerHelpersService } from "./useScoringHandlers.server-helpers.service";
import { createModalHandlersService } from "./useScoringHandlers.modals.service";
import { createPointSyncService } from "./useScoringHandlers.point-sync";
import { createServeActionsService } from "./useScoringHandlers.serve-actions.service";
import { createUndoRedoService } from "./useScoringHandlers.undo-redo.service";
import { createMatchFetchService } from "./useScoringHandlers.match-fetch";
import { createPointProcessorService } from "./useScoringHandlers.point-processor.service";

export function useScoringHandlers(ctx: ScoringHandlersContext): ScoringHandlersReturn {
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
    handleServeErrorOpen,
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

  const matchVersionRef = useRef<number | null>(match?.version ?? null);
  const lastPointLogIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (match?.version !== undefined && match?.version !== null) {
      matchVersionRef.current = match.version;
    }
  }, [match?.version]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      isProcessingRef.current = false;
    };
  }, [debounceTimerRef, isProcessingRef]);

  // ─── Fetch Match & Engine Setup ───────────────────────────────────────────
  const matchFetchService = createMatchFetchService({
    matchId,
    tokenRef,
    matchVersionRef,
    pointSequenceRef,
    engineRef,
    openRef,
    setMatch,
    setScoreState,
    setPointsHistory,
    setIsLoading,
    setError,
  });

  const fetchMatch = useCallback(
    async (forceEngineReset = false) => {
      await matchFetchService.fetchMatch(forceEngineReset);
    },
    [matchFetchService],
  );

  useEffect(() => {
    const handleSyncComplete = () => {
      fetchMatch(true);
    };
    window.addEventListener("offline-sync-complete", handleSyncComplete);
    return () => {
      window.removeEventListener("offline-sync-complete", handleSyncComplete);
    };
  }, [fetchMatch]);

  // ─── State persistence ────────────────────────────────────────────────────
  const persistState = useCallback(
    async (
      state: ScoringState,
      label: string,
      persistOptions?: {
        allowScoreEdit?: boolean;
        isManualScoreEdit?: boolean;
        voidPointLogId?: string;
      },
    ): Promise<{ success: boolean; needsResync?: boolean; conflict?: boolean; version?: number }> => {
      const engineAny = engineRef.current as
        | ({ getPointHistory?: () => HistoryEntry[] } & typeof engineRef.current)
        | null;
      const history = engineAny?.getPointHistory?.();

      const currentVersion = matchVersionRef.current ?? match?.version;
      const matchToUse = match ? { ...match, version: currentVersion } : null;

      const result = await persistStateWithRetry(state, label, {
        matchId,
        match: matchToUse,
        tokenRef,
        setError,
        fetchMatch,
        allowScoreEdit: persistOptions?.allowScoreEdit,
        isManualScoreEdit: persistOptions?.isManualScoreEdit,
        voidPointLogId: persistOptions?.voidPointLogId,
        history,
      });

      if (result.success && result.version !== undefined) {
        matchVersionRef.current = result.version;
        setMatch((prev) => (prev ? { ...prev, version: result.version } : prev));
      }

      return result;
    },
    [matchId, match, tokenRef, setError, fetchMatch, setMatch, engineRef],
  );

  // ─── Services ─────────────────────────────────────────────────────────────
  const serverHelpers = createServerHelpersService({ engineRef, match });
  const modalService = createModalHandlersService({ serveErrorState, open });
  const pointSync = createPointSyncService({ matchId, match, tokenRef, pointSequenceRef, setError });

  const undoRedoService = createUndoRedoService({
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
  });

  const pointProcessorService = createPointProcessorService({
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
    uploadAudioNote: undoRedoService.uploadAudioNote,
  });

  const processPoint = useCallback(
    async (flow: PointFlow): Promise<string | undefined> => {
      return pointProcessorService.processPoint(flow);
    },
    [pointProcessorService],
  );

  const handlePointDetailsConfirm = useCallback(
    (details: any, audio?: { blob: Blob; durationMs: number }) => {
      pointProcessorService.handlePointDetailsConfirm(details, audio);
    },
    [pointProcessorService],
  );

  // ─── Setup confirm ────────────────────────────────────────────────────────
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

  const serveActionsService = createServeActionsService({
    match,
    serveErrorState,
    serverHelpers,
    modalService,
    processPoint,
    engineRef,
    isProcessingRef,
    debounceTimerRef,
    closeAll,
    handleFirstServeErrorSet,
    handleFirstServeErrorClear,
    handleServeErrorOpen,
    handleServeErrorClose,
    setServeStep,
  });

  return {
    persistState,
    getServerId: serverHelpers.getServerId,
    getWinnerId: serverHelpers.getWinnerId,
    processPoint: async (flow: any) => {
      await processPoint(flow);
    },
    fetchMatch,
    handleSetupConfirm,
    handleUndo: undoRedoService.handleUndo,
    handleRedo: undoRedoService.handleRedo,
    handleCancelSecondServe: serveActionsService.handleCancelSecondServe,
    openAceModal: modalService.openAceModal,
    handleAceDirect: serveActionsService.handleAceDirect,
    openPointDetails: modalService.openPointDetails,
    handleServerEffectConfirm: serveActionsService.handleServerEffectConfirm,
    handleServeErrorConfirm: serveActionsService.handleServeErrorConfirm,
    handleServeErrorDirect: serveActionsService.handleServeErrorDirect,
    handleServeCancel: serveActionsService.handleServeCancel,
    handleServeErrorCancel: serveActionsService.handleServeErrorCancel,
    handlePointDetailsConfirm,
    isProcessing: isProcessingRef.current,
  };
}

export type { MatchData, ScoringHandlersContext, ScoringHandlersReturn };
