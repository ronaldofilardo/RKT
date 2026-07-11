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

export interface MatchData {
  id: string;
  format: string;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  initialServerId: string | null;
  scoreState: ScoringState | null;
  state: string;
  sportType?: string;
  courtType?: string;
  version?: number;
  includeLet?: boolean;
}

export interface ScoringHandlersContext {
  matchId: string;
  match: MatchData | null;
  isOnline: boolean;
  enqueue: (action: {
    matchId: string;
    type: "POINT";
    payload: any;
    timestamp: number;
  }) => Promise<any>;

  engineRef: MutableRefObject<ScoringEngine | null>;
  tokenRef: MutableRefObject<string | null>;
  modalParamsRef: MutableRefObject<Record<string, string>>;
  openRef: MutableRefObject<
    (modal: string, params?: Record<string, string>) => void
  >;
  pointSequenceRef: MutableRefObject<number>;

  serveErrorState: ScoreboardUIState;

  setMatch: Dispatch<SetStateAction<MatchData | null>>;
  setScoreState: Dispatch<SetStateAction<ScoringState | null>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setSetupLoading: Dispatch<SetStateAction<boolean>>;
  setPointsHistory: Dispatch<SetStateAction<string[]>>;
  setShowFinishedBanner: Dispatch<SetStateAction<boolean>>;

  handleServeErrorClose: () => void;
  handleFirstServeErrorSet: (err: {
    errorType: "out" | "net";
    serveEffect?: string;
    direction?: string;
  }) => void;
  handleFirstServeErrorClear: () => void;
  setServeStep: (step: "none" | "second") => void;

  open: (modal: string, params?: Record<string, string>) => void;
  close: () => void;
  closeAll: () => void;
  onUndoComplete?: () => void;
  isProcessingRef: MutableRefObject<boolean>;
  debounceTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

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
    async (state: ScoringState, label: string) => {
      if (!match) return;
      try {
        await fetch(`/api/matches/${matchId}/state`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${tokenRef.current}`,
          },
          body: JSON.stringify({
            state: state.isFinished ? "FINISHED" : "IN_PROGRESS",
            scoreState: state,
          }),
        });
      } catch (err) {
        console.error(`[persistState:${label}]`, err);
        setError(`Erro ao sincronizar placar (${label})`);
      }
    },
    [matchId, match, tokenRef, setError],
  );

  // ─── Server/winner identity helpers ────────────────────────────────────────

  const getServerId = useCallback(() => {
    if (!engineRef.current || !match) return "";
    const s = engineRef.current.getState().server;
    return s === "player1" ? match.player1.id : match.player2.id;
  }, [match, engineRef]);

  const getWinnerId = useCallback(
    (isServer: boolean) => {
      if (!engineRef.current || !match) return "";
      const s = engineRef.current.getState().server;
      if (isServer)
        return s === "player1" ? match.player1.id : match.player2.id;
      return s === "player1" ? match.player2.id : match.player1.id;
    },
    [match, engineRef],
  );

  // ─── Match data fetch ──────────────────────────────────────────────────────

  const fetchMatch = useCallback(
    async (forceEngineReset = false) => {
      try {
        const res = await fetch(`/api/matches/${matchId}`, {
          headers: { authorization: `Bearer ${tokenRef.current}` },
        });
        if (!res.ok) throw new Error();
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
          const annotationsPayload =
            flow.rallyDetails || flow.rallyLength
              ? {
                  rallyDetails: flow.rallyDetails ?? undefined,
                  rallyLength: flow.rallyLength ?? undefined,
                  isFirstServe: flow.isFirstServe ?? undefined,
                  isSecondServe: flow.isSecondServe ?? undefined,
                  firstFaultDetail: flow.firstFaultDetail ?? undefined,
                }
              : undefined;

          const payload = {
            winnerId: flow.winnerId,
            type: flow.type,
            serverId: flow.serverId,
            timestamp: flow.timestamp ?? Date.now(),
            sequenceNumber: seq,
            ...(annotationsPayload ? { annotations: annotationsPayload } : {}),
          };
          console.debug("[POINT REQUEST]", JSON.stringify(payload, null, 2));

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
    const step = serveErrorState.firstServeError ? "second" : "first";
    open("serve-effect", { context: "winner", serveStep: step });
  }, [serveErrorState.firstServeError, open]);

  const openPointDetails = useCallback(
    (side: "player1" | "player2") => {
      open("point-details", { winner: side });
    },
    [open],
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
      const direcaoMap = {
        aberto: "cruzada",
        centro: "centro",
        fechado: "paralela",
      } as const;
      const direcao =
        direction && direction in direcaoMap
          ? direcaoMap[direction as keyof typeof direcaoMap]
          : undefined;
      const rallyDetails: RallyDetails = {
        vencedor: "sacador",
        situacao: "devolucao",
        tipo: "winner",
        golpe: "fh",
        efeito: effect as any,
        direcao: direcao,
        previewBalls: 1,
      };
      
      debounceTimerRef.current = setTimeout(() => {
        processPoint({
          winnerId: getWinnerId(true),
          type: "ACE",
          serverId: getServerId(),
          isFirstServe: !isSecond,
          isSecondServe: isSecond,
          timestamp: Date.now(),
          rallyDetails,
          rallyLength: 1,
        }).catch((err) =>
          console.error(
            "[handleServerEffectConfirm] Error processing ACE:",
            err,
          ),
        );
        handleFirstServeErrorClear();
        setServeStep("none");
      }, 50);
    },
    [
      match,
      serveErrorState,
      getWinnerId,
      getServerId,
      processPoint,
      handleFirstServeErrorClear,
      setServeStep,
      closeAll,
    ],
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
        const direcaoMap = {
          aberto: "cruzada",
          centro: "centro",
          fechado: "paralela",
        } as const;
        const direcao =
          direction && direction in direcaoMap
            ? (direcaoMap[direction as keyof typeof direcaoMap] as RallyDirecao)
            : undefined;
        const rallyDetails: RallyDetails = {
          vencedor: "devolvedor",
          situacao: "devolucao",
          tipo: "erro_forcado",
          golpe: "fh",
          subtipo2:
            serveErrorState.pendingServeError.errorType === "net"
              ? "net"
              : "out",
          efeito: effect as any,
          direcao: direcao,
          previewBalls: 1,
        };
        closeAll();
        
        debounceTimerRef.current = setTimeout(() => {
          processPoint({
            winnerId: getWinnerId(false),
            type: "DOUBLE_FAULT",
            serverId: getServerId(),
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
      getWinnerId,
      getServerId,
      processPoint,
      handleFirstServeErrorSet,
      handleFirstServeErrorClear,
      handleServeErrorClose,
      setServeStep,
      closeAll,
      engineRef,
    ],
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
      
      if (rallyLengthFromModal) {
        details.rallyLength = parseInt(rallyLengthFromModal, 10) || details.previewBalls;
      }
      
      const flowType =
        details.tipo === "winner"
          ? "WINNER"
          : details.tipo === "erro_forcado"
            ? "FORCED_ERROR"
            : "UNFORCED_ERROR";
      const id = winnerSide === "player1" ? match.player1.id : match.player2.id;
      
      closeAll();
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        processPoint({
          winnerId: id,
          type: flowType,
          serverId: getServerId(),
          isFirstServe:
            serveErrorState.serveStep !== "second" &&
            !serveErrorState.firstServeError,
          isSecondServe:
            serveErrorState.serveStep === "second" ||
            serveErrorState.firstServeError !== null,
          timestamp: Date.now(),
          rallyDetails: details,
          rallyLength: details.rallyLength,
        });
      }, 50);
    },
    [
      match,
      processPoint,
      getServerId,
      serveErrorState,
      closeAll,
      modalParamsRef,
      debounceTimerRef,
    ],
  );

  // ─── Session lifecycle ─────────────────────────────────────────────────────

  // abandonCurrentSession lives in useSessionManager

  return {
    persistState,
    getServerId,
    getWinnerId,
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
