"use client";

import { useCallback } from "react";
import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import { ScoringEngine } from "@/core/scoring/engine";
import type {
  ScoringState,
  PointFlow,
  RallyDetails,
} from "@/core/scoring/types";
import type { RallyDirecao } from "@/schemas/contracts";
import type { ScoreboardUIState } from "@/hooks/useScoreboardUIState";
import type {
  MatchData,
  ScoringHandlersContext,
  ScoringHandlersReturn,
} from "./useScoringHandlers.types";
import { persistStateWithRetry } from "./useScoringHandlers.persistence";
import { createServerHelpers } from "./useScoringHandlers.server-helpers";
import { createModalHandlers } from "./useScoringHandlers.modals";

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

  // ─── State persistence ────────────────────────────────────────────────────
  // FIX Bug 1/4/6: unificado em uma única função. Não chamar de processPoint
  // (o POST /point já persiste com validação de versão + PointLog); usar
  // apenas em undo/let/edit onde não há endpoint dedicado.

const persistState = useCallback(
    async (state: ScoringState, label: string): Promise<{ success: boolean; needsResync?: boolean }> => {
      return persistStateWithRetry(state, label, {
        matchId,
        match,
        tokenRef,
        setError,
      });
    },
    [matchId, match, tokenRef, setError],
  );

  const { getServerId: getServerIdHelper, getWinnerId: getWinnerIdHelper } = createServerHelpers({ engineRef, match });
  const modalHandlers = createModalHandlers({ serveErrorState, open });

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
        }

        setIsLoading(false);
      } catch (err) {
        console.error("[fetchMatch]", err);
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
    ],
  );

  // ─── Core point processing ─────────────────────────────────────────────────

  const processPoint = useCallback(
    async (flow: PointFlow) => {
      if (!engineRef.current || !match || isProcessingRef.current) return;
      
      isProcessingRef.current = true;
      
      try {
        const state = engineRef.current.getState();
        if (state.isFinished) {
          isProcessingRef.current = false;
          return;
        }
        
        engineRef.current.applyPoint(flow);
        const newState = engineRef.current.getState() as ScoringState;
        setScoreState(newState);
        setPointsHistory((prev) => [...prev.slice(-19), flow.winnerId]);
        const seq = ++pointSequenceRef.current;

        if (isOnline) {
          const payload = {
            winnerId: flow.winnerId,
            type: flow.type,
            serverId: flow.serverId,
            timestamp: flow.timestamp ?? Date.now(),
            sequenceNumber: seq,
            rallyDetails: flow.rallyDetails ?? undefined,
            rallyLength: flow.rallyLength ?? undefined,
            isFirstServe: flow.isFirstServe ?? undefined,
            isSecondServe: flow.isSecondServe ?? undefined,
            firstFaultDetail: flow.firstFaultDetail ?? undefined,
          };
          console.log("[POINT REQUEST] Full payload:", JSON.stringify(payload, null, 2));

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          try {
            const res = await fetch(`/api/matches/${matchId}/point`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                authorization: `Bearer ${tokenRef.current}`,
              },
              body: JSON.stringify(payload),
              signal: controller.signal,
            }).catch(() => null);

            clearTimeout(timeoutId);

            if (res && res.ok) {
              try {
                const data = await res.json();
                if (data.scoreState) {
                  const currentHistory = engineRef.current.getPointHistory();
                  setScoreState(data.scoreState);
                  engineRef.current = ScoringEngine.fromSerialized(
                    {
                      format: match.format as any,
                      player1Id: match.player1.id,
                      player2Id: match.player2.id,
                      initialServerId: match.initialServerId || match.player1.id,
                    },
                    JSON.stringify(data.scoreState),
                  );
                  engineRef.current.restorePointHistory(currentHistory);
                }
              } catch (err) {
                console.error("[processPoint:sync-response]", err);
              }
            } else if (res) {
              const isConflict = res.status === 409;
              if (isConflict) {
                try {
                  const errData = await res.json();
                  if (
                    errData.error === "SEQUENCE_CONFLICT" &&
                    errData.expectedSequence
                  ) {
                    pointSequenceRef.current = errData.expectedSequence - 1;
                  }
                } catch {}
                setError("Conflito de sequência — sincronizando...");
              } else {
                let errorMsg = `Erro ao registrar ponto (${res.status})`;
                try {
                  const errData = await res.json();
                  console.error(
                    "[POINT RESPONSE ERROR]",
                    res.status,
                    JSON.stringify(errData, null, 2),
                  );
                  if (errData.error) {
                    errorMsg = `Erro: ${errData.error} — ${errData.message || "sincronizando..."}`;
                  }
                } catch (e) {
                  const text = await res.text();
                  console.error("[POINT RESPONSE ERROR]", res.status, text);
                }
                setError(errorMsg);
              }
              await fetchMatch(true);
            }
          } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
              console.error("[processPoint] Request timeout");
              setError("Tempo esgotado ao registrar ponto — verifique sua conexão");
            } else {
              console.error("[processPoint] Request error", err);
              setError("Erro de conexão ao registrar ponto");
            }
            await fetchMatch(true);
          }
        } else {
          await enqueue({
            matchId,
            type: "POINT",
            payload: flow as any,
            timestamp: Date.now(),
          });
        }

        if (newState.isFinished) setShowFinishedBanner(true);
      } catch (err) {
        console.error("[processPoint]", err);
        setError("Erro ao registrar ponto");
      } finally {
        isProcessingRef.current = false;
      }
    },
    [
      matchId,
      match,
      isOnline,
      enqueue,
      engineRef,
      tokenRef,
      pointSequenceRef,
      setScoreState,
      setPointsHistory,
      setShowFinishedBanner,
      setError,
      fetchMatch,
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
        console.error("[handleSetupConfirm]", err);
        setError("Erro ao iniciar partida");
      } finally {
        setSetupLoading(false);
      }
    },
    [matchId, match, fetchMatch, close, tokenRef, setSetupLoading, setError],
  );

  // ─── Point action handlers ─────────────────────────────────────────────────

  const handleUndo = useCallback(() => {
    if (!engineRef.current) return;
    const undone = engineRef.current.undoLastPoint();
    if (!undone) return;
    const newState = engineRef.current.getState() as ScoringState;
    setScoreState(newState);
    setPointsHistory((prev) => prev.slice(0, -1));
    persistState(newState, "undo");
    closeAll();
    onUndoComplete?.();
  }, [persistState, closeAll, engineRef, setScoreState, setPointsHistory, onUndoComplete]);

  const handleLet = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.replayCurrentPoint();
    setScoreState(engineRef.current.getState() as ScoringState);
    persistState(engineRef.current.getState() as ScoringState, "let");
  }, [persistState, engineRef, setScoreState]);

  const handleCancelSecondServe = useCallback(() => {
    setServeStep("none");
  }, [setServeStep]);

  // ─── Modal openers ─────────────────────────────────────────────────────────

  const openAceModal = useCallback(() => {
    modalHandlers.openAceModal();
  }, [modalHandlers]);

  const openPointDetails = useCallback(
    (side: "player1" | "player2") => {
      modalHandlers.openPointDetails(side);
    },
    [modalHandlers]
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

      const rallyDetails = modalHandlers.createAceRallyDetails(effect, direction);

      debounceTimerRef.current = setTimeout(() => {
        processPoint({
          winnerId: getWinnerIdHelper(true),
          type: "ACE",
          serverId: getServerIdHelper(),
          isFirstServe: !isSecond,
          isSecondServe: isSecond,
          timestamp: Date.now(),
          rallyDetails,
          rallyLength: 1,
        }).catch((err) =>
          console.error(
            "[handleServerEffectConfirm] Error processing ACE:",
            err
          )
        );
        handleFirstServeErrorClear();
        setServeStep("none");
      }, 50);
    },
    [
      match,
      serveErrorState,
      getWinnerIdHelper,
      getServerIdHelper,
      processPoint,
      handleFirstServeErrorClear,
      setServeStep,
      closeAll,
      modalHandlers,
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
        const rallyDetails = modalHandlers.createDoubleFaultRallyDetails(
          serveErrorState.pendingServeError.errorType,
          effect,
          direction
        );
        closeAll();

        debounceTimerRef.current = setTimeout(() => {
          processPoint({
            winnerId: getWinnerIdHelper(false),
            type: "DOUBLE_FAULT",
            serverId: getServerIdHelper(),
            timestamp: Date.now(),
            rallyDetails,
            rallyLength: 1,
            isFirstServe: false,
            isSecondServe: true,
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
      getWinnerIdHelper,
      getServerIdHelper,
      processPoint,
      handleFirstServeErrorSet,
      handleFirstServeErrorClear,
      handleServeErrorClose,
      setServeStep,
      closeAll,
      engineRef,
      modalHandlers,
    ]
  );

  const handleServeCancel = useCallback(() => {
    handleServeErrorClose();
    if (serveErrorState.firstServeError && engineRef.current) {
      handleFirstServeErrorClear();
    }
    handleFirstServeErrorClear();
  }, [
    handleServeErrorClose,
    serveErrorState.firstServeError,
    handleFirstServeErrorClear,
    engineRef,
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

  // ─── Point details ─────────────────────────────────────────────────────────

  const handlePointDetailsConfirm = useCallback(
    (details: RallyDetails) => {
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
        serverId: getServerIdHelper(),
        isFirstServe:
          serveErrorState.serveStep !== "second" &&
          !serveErrorState.firstServeError,
        isSecondServe:
          serveErrorState.serveStep === "second" ||
          serveErrorState.firstServeError !== null,
        timestamp: Date.now(),
        rallyDetails: details,
        rallyLength: rallyLengthToUse,
      });
    },
    [
      match,
      processPoint,
      getServerIdHelper,
      serveErrorState,
      closeAll,
      modalParamsRef,
    ],
  );

  // ─── Session lifecycle ─────────────────────────────────────────────────────

  // abandonCurrentSession lives in useSessionManager

  return {
    persistState,
    getServerId: getServerIdHelper,
    getWinnerId: getWinnerIdHelper,
    processPoint,
    fetchMatch,
    handleSetupConfirm,
    handleUndo,
    handleLet,
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
