"use client";

import { useEffect, useCallback } from "react";
import { useScoringHandlers } from "@/hooks/useScoringHandlers";
import { useSessionManager } from "@/hooks/useSessionManager";
import { useCommentOfflineSync } from "@/hooks/useCommentOfflineSync";
import type { SetEditData } from "@/components/scoring/editScoreHelpers";
import type { ScoringPageState } from "./useScoringPageState";

export interface ScoringPageHandlers {
  persistState: ReturnType<typeof useScoringHandlers>["persistState"];
  fetchMatch: ReturnType<typeof useScoringHandlers>["fetchMatch"];
  handleSetupConfirm: ReturnType<typeof useScoringHandlers>["handleSetupConfirm"];
  handleUndo: ReturnType<typeof useScoringHandlers>["handleUndo"];
  handleVoltar: ReturnType<typeof useScoringHandlers>["handleVoltar"];
    openAceModal: ReturnType<typeof useScoringHandlers>["openAceModal"];
  handleAceDirect: ReturnType<typeof useScoringHandlers>["handleAceDirect"];

  handleServerEffectConfirm: ReturnType<typeof useScoringHandlers>["handleServerEffectConfirm"];
  handleServeErrorConfirm: ReturnType<typeof useScoringHandlers>["handleServeErrorConfirm"];
  handleServeErrorDirect: ReturnType<typeof useScoringHandlers>["handleServeErrorDirect"];
  handleServeErrorCancel: ReturnType<typeof useScoringHandlers>["handleServeErrorCancel"];
  handlePointDetailsConfirm: ReturnType<typeof useScoringHandlers>["handlePointDetailsConfirm"];
  handlePointFromCard: (winnerSide: "player1" | "player2") => void;
  handleServeErrorWithModal: (errorType: "out" | "net", step: "first" | "second") => void;
  handleEditScoreCancel: () => void;
  handleEditScoreRefreshFloor: () => Promise<{ player1: number; player2: number } | null>;
  isProcessing: boolean;
  abandonCurrentSession: ReturnType<typeof useSessionManager>["abandonCurrentSession"];
  handleEditScore: (setResults: SetEditData[], server: "player1" | "player2") => Promise<void>;
  handleCommentCreate: (content: string, audio?: { blob: Blob; durationMs: number }, category?: string) => Promise<void>;
}

export function useScoringPageEffects(state: ScoringPageState): ScoringPageHandlers {
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
    isProcessingRef,
    debounceTimerRef,
    suspendedSession,
    setSessionActive,
    setSuspendedSession,
    setFloorCurrentSets,
    clearPendingEdit,
    updateScore,
    scoreState,
    setElapsed,
    session,
    setEngineTick,
    setSyncStatus,
    syncPendingMatches,
    toast,
    fetchPointLogAudioMeta,
    clearQueueForMatch,
    setComments,
    fetchComments,
  } = state;

  const { enqueueComment } = useCommentOfflineSync();

  useEffect(() => {
    const freshToken = sessionStorage.getItem("access_token");
    if (freshToken !== tokenRef.current) {
      tokenRef.current = freshToken;
    }
  });

  const {
    persistState,
    fetchMatch,
    handleSetupConfirm,
    handleUndo,
    handleVoltar,
    openAceModal,
    handleAceDirect,
    handleServerEffectConfirm,
    handleServeErrorConfirm,
    handleServeErrorDirect,
    handleServeErrorCancel,
    handlePointDetailsConfirm,
    isProcessing,
  } = useScoringHandlers({
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
    onUndoComplete: () => setEngineTick(Date.now()),
    onPointProcessed: () => setEngineTick(Date.now()),
    onAudioUploaded: fetchPointLogAudioMeta,
    isProcessingRef,
    debounceTimerRef,
  });

  const { abandonCurrentSession, handleEditScore: originalHandleEditScore } =
    useSessionManager({
      matchId,
      match,
      isLoading: state.isLoading,
      engineRef,
      tokenRef,
      sessionIdRef: state.sessionIdRef,
      matchIdRef: state.matchIdRef,
      suspendedSession,
      fetchMatch,
      persistState,
      setScoreState,
      setSessionActive,
      setSuspendedSession,
      setFloorCurrentSets,
      clearPendingEdit,
      updateScoreContext: updateScore,
      close,
      closeAll,
      isProcessingRef,
      clearQueueForMatch,
    });

  const handleEditScore = useCallback(
    async (setResults: SetEditData[], server: "player1" | "player2") => {
      await originalHandleEditScore(setResults, server);
    },
    [originalHandleEditScore]
  );

  const handleCommentCreate = useCallback(
    async (content: string, audio?: { blob: Blob; durationMs: number }, category?: string) => {
      const finalContent = content?.trim() || (audio ? '(Nota de voz)' : '');

      // Offline: enqueue for later sync
      if (!isOnline) {
        await enqueueComment({
          matchId,
          type: 'COMMENT',
          payload: { content: finalContent, category, audioBlob: audio?.blob, audioDurationMs: audio?.durationMs },
          timestamp: Date.now(),
        });
        toast({ type: 'success', message: 'Comentário salvo localmente, sincronizando ao reconectar' });
        return;
      }

      try {
        const token = tokenRef.current;
        const res = await fetch(`/api/matches/${matchId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ content: finalContent, category }),
        });

        if (!res.ok) {
          toast({ type: 'error', message: 'Erro ao criar comentário' });
          return;
        }

        const comment = await res.json();

        if (audio && comment.id) {
          const formData = new FormData();
          formData.append('file', audio.blob);
          formData.append('durationMs', String(audio.durationMs));
          await fetch(`/api/matches/${matchId}/comments/${comment.id}/audio`, {
            method: 'POST',
            headers: token ? { authorization: `Bearer ${token}` } : {},
            body: formData,
          });
        }

        setComments((prev) => [
          {
            id: comment.id,
            content: comment.content,
            category: comment.category,
            authorName: comment.authorName,
            createdAt: comment.createdAt,
            hasAudioNote: Boolean(audio),
            audioNoteDuration: audio?.durationMs ?? null,
          },
          ...prev,
        ]);

        toast({ type: 'success', message: 'Comentário registrado' });
      } catch {
        toast({ type: 'error', message: 'Erro ao criar comentário' });
      }
    },
    [matchId, tokenRef, setComments, toast, isOnline, enqueueComment]
  );

  const handlePointFromCard = useCallback(
    (winnerSide: "player1" | "player2") => {
      open("point-details", { winner: winnerSide });
    },
    [open],
  );

  const handleServeErrorWithModal = useCallback(
    (errorType: "out" | "net", step: "first" | "second") => {
      if (isProcessing) return;
      handleServeErrorOpen(errorType, step);
      open("serve-effect", {
        context: "error",
        serveStep: step,
        errorType,
      });
    },
    [isProcessing, handleServeErrorOpen, open],
  );

  const handleEditScoreCancel = useCallback(() => {
    clearPendingEdit();
    close();
  }, [clearPendingEdit, close]);

  const handleEditScoreRefreshFloor = useCallback(async () => {
    if (!engineRef.current || !match) return null;
    const currentState = engineRef.current.getState();
    const sets = currentState.sets;
    if (sets.length === 0) return null;

    // P2-10 FIX: Se o último set é vazio (auto-added 0-0), olhar para
    // o set anterior completo como floor. O set vazio não representa
    // progresso real — usar seu placar como floor inutiliza a proteção.
    for (let i = sets.length - 1; i >= 0; i--) {
      const set = sets[i];
      const isLastSet = i === sets.length - 1;
      // Para o último set, só usar como floor se tiver progresso real
      if (isLastSet && set.player1 === 0 && set.player2 === 0) continue;
      // Para qualquer set com progresso, usar como floor
      if (set.player1 > 0 || set.player2 > 0) {
        return { player1: set.player1, player2: set.player2 };
      }
    }

    return null;
  }, [engineRef, match]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  useEffect(() => {
    if (state.viewMode === 'timeline' && match) {
      fetchPointLogAudioMeta();
      fetchComments();
    }
  }, [state.viewMode, match, fetchPointLogAudioMeta, fetchComments]);

  useEffect(() => {
    if (isOnline) {
      setSyncStatus("syncing");
      syncPendingMatches();
      const timer = setTimeout(() => {
        setSyncStatus((current) => (current === 'syncing' ? 'synced' : current));
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSyncStatus("offline");
    }
  }, [isOnline, syncPendingMatches, setSyncStatus]);

  useEffect(() => {
    const handleSyncComplete = () => {
      setSyncStatus("synced");
      toast({ type: "success", message: "Pontos offline sincronizados com sucesso" });
    };
    window.addEventListener("offline-sync-complete", handleSyncComplete);
    return () => window.removeEventListener("offline-sync-complete", handleSyncComplete);
  }, [toast, setSyncStatus]);

  useEffect(() => {
    if (scoreState?.startedAt) {
      const startedAtMs = scoreState.startedAt;
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)));
    } else {
      setElapsed(0);
    }
  }, [scoreState?.startedAt, setElapsed]);

  useEffect(() => {
    if (session.pendingEditScore) {
      setFloorCurrentSets(session.pendingEditScore.floorSets);
      open("edit-score");
    }
  }, [session.pendingEditScore, open, setFloorCurrentSets]);

  return {
    persistState,
    fetchMatch,
    handleSetupConfirm,
    handleUndo,
    handleVoltar,
    openAceModal,
    handleAceDirect,
    handleServerEffectConfirm,
    handleServeErrorConfirm,
    handleServeErrorDirect,
    handleServeErrorCancel,
    handlePointDetailsConfirm,
    handlePointFromCard,
    handleServeErrorWithModal,
    handleEditScoreCancel,
    handleEditScoreRefreshFloor,
    isProcessing,
    abandonCurrentSession,
    handleEditScore,
    handleCommentCreate,
  };
}
