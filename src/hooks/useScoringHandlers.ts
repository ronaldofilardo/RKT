"use client";
import { logger } from "@/lib/logger";
import { TIMEOUTS } from "@/lib/constants";

import { useCallback, useEffect, useRef } from "react";
import { ScoringEngine } from "@/core/scoring/engine";
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
import { createPointSyncService } from "./useScoringHandlers.point-sync";

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

  // ─── Match data fetch ──────────────────────────────────────────────────────

  const fetchMatch = useCallback(
    async (forceEngineReset = false) => {
      try {
        const res = await fetch(`/api/matches/${matchId}`, {
          headers: { authorization: `Bearer ${tokenRef.current}` },
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Erro ao buscar partida: ${res.status}`);
        }
        const data: MatchData = await res.json();
        setMatch(data);

        if (typeof data.version === "number") {
          matchVersionRef.current = data.version;
        }

        if (data._count && typeof data._count.pointLog === "number") {
          pointSequenceRef.current = data._count.pointLog;
        } else if (typeof data.version === "number") {
          pointSequenceRef.current = data.version;
        }

        if (forceEngineReset || !engineRef.current) {
          const config = {
            format: data.format as any,
            player1Id: data.player1.id,
            player2Id: data.player2.id,
            initialServerId: data.initialServerId || data.player1.id,
          };

          let scoreStateToUse: any = data.scoreState;

          if (scoreStateToUse) {
            if (typeof scoreStateToUse === "string") {
              try {
                scoreStateToUse = JSON.parse(scoreStateToUse);
              } catch {}
            }
            if (!scoreStateToUse.setsWon) {
              scoreStateToUse.setsWon = { player1: 0, player2: 0 };
            }
            engineRef.current = ScoringEngine.fromSerialized(
              config,
              JSON.stringify(scoreStateToUse),
            );
          } else if (data.initialServerId) {
            engineRef.current = new ScoringEngine(config);
          } else {
            openRef.current("setup");
          }
          setScoreState(
            (engineRef.current?.getState() as ScoringState) ?? null,
          );

          if (forceEngineReset && engineRef.current) {
            const serverHistory = engineRef.current.getPointHistory();
            const synced = serverHistory
              .slice(-20)
              .map((entry) => entry.point.winnerId);
            if (synced.length > 0) {
              setPointsHistory(synced);
            } else {
              setPointsHistory([]);
            }
          }
        }

        setIsLoading(false);
      } catch (err) {
        logger.error("[fetchMatch]", err);
        setError("Erro ao carregar partida");
        setIsLoading(false);
      }
    },
    [
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
    ],
  );

  // ─── State persistence ────────────────────────────────────────────────────
  // FIX Bug 1/4/6: unificado em uma única função. Não chamar de processPoint
  // (o POST /point já persiste com validação de versão + PointLog); usar
  // apenas em undo/let/edit onde não há endpoint dedicado.

  const persistState = useCallback(
    async (
      state: ScoringState,
      label: string,
      persistOptions?: {
        allowScoreEdit?: boolean;
        isManualScoreEdit?: boolean;
        voidPointLogId?: string;
      }
    ): Promise<{ success: boolean; needsResync?: boolean; conflict?: boolean; version?: number }> => {
      // Tolerante a engines mockados sem getPointHistory (testes). Em produção
      // sempre existe; se ausente, history fica undefined e mantém o legado
      // (somente `state` no snapshot).
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
        // Em undo/redo o engine mantém o histórico detalhado (com
        // rallyDetails/firstFaultDetail). Persisti-lo aqui evita que o
        // PATCH /state substitua o snapshot anterior e apague os dados do
        // relatório. Em fluxos sem histórico pertinente (ex.: edit-score,
        // que chama engine.loadState e zera o history), history será []
        // e snapshot correspondente gera o mesmo efeito que antes.
        history,
      });

      if (result.success && result.version !== undefined) {
        matchVersionRef.current = result.version;
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

  // ─── Track last pointLogId for undo voiding ────────────────────────────────
  const lastPointLogIdRef = useRef<string | null>(null);

  // ─── Core point processing ─────────────────────────────────────────────────

  const processPoint = useCallback(
    async (flow: PointFlow): Promise<string | undefined> => {
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
        setScoreState(newState);
        setPointsHistory((prev) => [...prev.slice(-19), flow.winnerId]);
        const seq = ++pointSequenceRef.current;

        const applySuccessResult = (serverResponse: NonNullable<Awaited<ReturnType<typeof pointSync.syncPointToServer>>["serverResponse"]>) => {
          const currentHistory = engineRef.current!.getPointHistory();
          const localState = engineRef.current!.getState();
          const serverState = serverResponse.scoreState!;

          // Guard: if local state is in a tiebreak but server response lost
          // the tiebreak info (corrupted snapshot), skip the overwrite to
          // prevent the UI from switching from tiebreak to game scoring.
          const localInTiebreak = localState.sets?.some(
            (s: any) => s.isTiebreak && s.tiebreakScore
          );
          const serverHasTiebreak = serverState.sets?.some(
            (s: any) => s.isTiebreak && s.tiebreakScore
          );
          if (localInTiebreak && !serverHasTiebreak) {
            logger.warn("[processPoint] server response missing tiebreak info — keeping local state", {
              localSets: localState.sets?.length,
              serverSets: serverState.sets?.length,
            });
          } else {
            setScoreState(serverState);
            engineRef.current = ScoringEngine.fromSerialized(
              {
                format: match.format as any,
                player1Id: match.player1.id,
                player2Id: match.player2.id,
                initialServerId: match.initialServerId || match.player1.id,
              },
              JSON.stringify(serverState),
            );
            engineRef.current.restorePointHistory(currentHistory);
          }

          if (serverResponse.version !== undefined) {
            matchVersionRef.current = serverResponse.version;
            setMatch((prev) =>
              prev ? { ...prev, version: serverResponse.version } : prev,
            );
          }

          if (serverResponse.pointLogId) {
            lastPointLogIdRef.current = serverResponse.pointLogId;
          }

          return serverResponse.pointLogId;
        };

        if (isOnline) {
          const clientEventId =
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const result = await pointSync.syncPointToServer(flow, seq, clientEventId);

          if (result.success && result.serverResponse?.scoreState) {
            return applySuccessResult(result.serverResponse);
          } else if (result.needsResync) {
            // O ponto pode não ter sido persistido (timeout, conflito de
            // sequência, erro de rede). Resincroniza a sequência/estado com
            // o servidor e tenta reenviar este mesmo ponto UMA vez, para não
            // perder silenciosamente o toque do usuário. Reaproveita o
            // mesmo clientEventId: se a tentativa original já tiver sido
            // salva no servidor (ex.: timeout só no cliente), o dedup por
            // clientEventId evita duplicar o ponto.
            await fetchMatch(true);
            const retrySeq = ++pointSequenceRef.current;
            const retryResult = await pointSync.syncPointToServer(flow, retrySeq, clientEventId);

            if (retryResult.success && retryResult.serverResponse?.scoreState) {
              setError(null);
              return applySuccessResult(retryResult.serverResponse);
            } else if (retryResult.needsResync) {
              // Segunda falha seguida: desiste do reenvio automático e
              // resincroniza mais uma vez para deixar a sequência consistente,
              // mas mantém o erro visível — o ponto não foi salvo.
              await fetchMatch(true);
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

      const pointLogIdToVoid = lastPointLogIdRef.current;

      // Anulação do PointLog e atualização de scoreState coordenadas atomicamente
      // no backend via persistState (PATCH /state com voidPointLogId).
      // Se houver conflito de versão (409) ou erro, o ponto NÃO fica anulado
      // no banco e a resincronização mantém os dados consistentes.
      const result = await persistState(newState, "undo", {
        voidPointLogId: pointLogIdToVoid ?? undefined,
      });

      if (result.success) {
        lastPointLogIdRef.current = null;
        pointSequenceRef.current = Math.max(0, pointSequenceRef.current - 1);
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
    pointSequenceRef,
  ]);

  const handleRedo = useCallback(async () => {
    if (!engineRef.current || isProcessingRef.current) return;
    if (debounceTimerRef.current) return;
    isProcessingRef.current = true;
    try {
      const redone = engineRef.current.replayCurrentPoint();
      if (!redone) return;
      const newState = engineRef.current.getState() as ScoringState;
      setScoreState(newState);
      setPointsHistory((prev) => [...prev, redone.point.winnerId]);
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
    setPointsHistory,
  ]);

  const handleCancelSecondServe = useCallback(() => {
    setServeStep("none");
  }, [setServeStep]);

// ─── Modal openers ─────────────────────────────────────────────────────────

    const openAceModal = useCallback(() => {
    modalService.openAceModal();
  }, [modalService]);

  const handleAceDirect = useCallback(() => {
    if (!match || isProcessingRef.current) return;
    const isSecond =
      serveErrorState.serveStep === "second" ||
      serveErrorState.firstServeError !== null;
    closeAll();
    const rallyDetails = modalService.createAceRallyDetails();
    processPoint({
      winnerId: serverHelpers.getWinnerId(true),
      type: "ACE",
      serverId: serverHelpers.getServerId(),
      isFirstServe: !isSecond,
      isSecondServe: isSecond,
      timestamp: Date.now(),
      rallyDetails,
      rallyLength: 1,
    }).finally(() => {
      handleFirstServeErrorClear();
      setServeStep("none");
    }).catch((err: unknown) =>
      logger.error("[handleAceDirect] Error processing ACE:", err),
    );
  }, [
    match,
    isProcessingRef,
    serveErrorState,
    closeAll,
    modalService,
    processPoint,
    serverHelpers,
    handleFirstServeErrorClear,
    setServeStep,
  ]);

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
        }).finally(() => {
          handleFirstServeErrorClear();
          setServeStep("none");
        }).catch((err) =>
          logger.error(
            "[handleServerEffectConfirm] Error processing ACE:",
            err
          )
        );
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
          }).finally(() => {
            handleFirstServeErrorClear();
            handleServeErrorClose();
            setServeStep("none");
          });
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

  const handleServeErrorDirect = useCallback(
    (errorType: "out" | "net", step: "first" | "second") => {
      if (!match || isProcessingRef.current) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      handleServeErrorOpen(errorType, step);

      if (step === "first") {
        if (!engineRef.current) return;
        handleFirstServeErrorSet({
          errorType: serveErrorState.pendingServeError?.errorType ?? errorType,
          serveEffect: undefined,
          direction: undefined,
        });
        handleServeErrorClose();
        setServeStep("second");
        closeAll();
      } else {
        const rallyDetails = modalService.createDoubleFaultRallyDetails(
          errorType,
          undefined,
          undefined
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
          }).finally(() => {
            handleFirstServeErrorClear();
            handleServeErrorClose();
            setServeStep("none");
          });
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
      handleServeErrorOpen,
      setServeStep,
      closeAll,
      engineRef,
      modalService,
      debounceTimerRef,
      isProcessingRef,
    ]
  );

  const handleServeCancel = useCallback(() => {
    if (isProcessingRef.current) return;
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
    isProcessingRef,
  ]);

  const handleServeErrorCancel = useCallback(() => {
    if (isProcessingRef.current) return;
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
    isProcessingRef,
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
    (details: RallyDetails, audio?: { blob: Blob; durationMs: number }) => {
      const winnerSide = modalParamsRef.current.winner as "player1" | "player2";
      const rallyLengthFromModal = modalParamsRef.current.rallyLength;
      if (!match || !winnerSide || isProcessingRef.current) return;
      
      const rallyLengthToUse = rallyLengthFromModal
        ? parseInt(rallyLengthFromModal, 10) || details.previewBalls
        : details.previewBalls;
      
      const flowType =
        details.tipo === "winner"
          ? "WINNER"
          : details.tipo === "erro_forcado"
            ? "FORCED_ERROR"
            : "UNFORCED_ERROR";
      const id = winnerSide === "player1" ? match.player1.id : match.player2.id;
      
      closeAll();
      
      processPoint({
        winnerId: id,
        type: flowType,
        serverId: serverHelpers.getServerId(),
        isFirstServe:
          serveErrorState.serveStep !== "second" &&
          !serveErrorState.firstServeError,
        isSecondServe:
          serveErrorState.serveStep === "second" ||
          serveErrorState.firstServeError !== null,
        timestamp: Date.now(),
        rallyDetails: details,
        rallyLength: rallyLengthToUse,
      }).then((pointLogId) => {
        if (audio && pointLogId) {
          uploadAudioNote(match.id, pointLogId, audio.blob, audio.durationMs, tokenRef.current);
        }
      });
    },
    [
      match,
      processPoint,
      serverHelpers,
      serveErrorState,
      closeAll,
      modalParamsRef,
      isProcessingRef,
      tokenRef,
      uploadAudioNote,
    ],
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
    handleAceDirect,
    openPointDetails,

    handleServerEffectConfirm,
    handleServeErrorConfirm,
    handleServeErrorDirect,
    handleServeCancel,
    handleServeErrorCancel,
    handlePointDetailsConfirm,
    isProcessing: isProcessingRef.current,
  };
}

export type { MatchData, ScoringHandlersContext, ScoringHandlersReturn };
