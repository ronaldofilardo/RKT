"use client";

import { useCallback, useEffect } from "react";
import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState, SetScore, GameScore } from "@/core/scoring/types";
import type { SetEditData } from "@/components/scoring/editScoreHelpers";
import { setsToWinForFormat } from "@/components/scoring/editScoreHelpers";
import type { TennisFormat } from "@/core/scoring/types";
const BEST_OF_3 = "BEST_OF_3";
import { startSession } from "@/services/annotationSessionService";
import type { MatchData } from "@/hooks/useScoringHandlers";

export interface SuspendedSessionState {
  matchStateSnapshot: string | null;
  previousPointsCount: number;
  snapshotStatus: "IN_SYNC" | "SNAPSHOT_AHEAD" | "BANK_AHEAD";
  snapshotPointCount: number;
  bankPointCount: number;
  bankScoreState: ScoringState | null;
}

export interface SessionManagerContext {
  matchId: string;
  match: MatchData | null;
  isLoading: boolean;

  engineRef: MutableRefObject<ScoringEngine | null>;
  tokenRef: MutableRefObject<string | null>;
  sessionIdRef: MutableRefObject<string | null>;
  matchIdRef: MutableRefObject<string>;

  suspendedSession: SuspendedSessionState | null;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
  persistState: (state: ScoringState, label: string) => Promise<void>;

  setScoreState: Dispatch<SetStateAction<ScoringState | null>>;
  setSessionActive: Dispatch<SetStateAction<boolean>>;
  setSuspendedSession: Dispatch<SetStateAction<SuspendedSessionState | null>>;
  setFloorCurrentSets: Dispatch<
    SetStateAction<{ player1: number; player2: number } | null>
  >;
  setBallExchangeCount: Dispatch<SetStateAction<number>>;
  setPendingEditScore: Dispatch<
    SetStateAction<{
      scoreState: ScoringState;
      floorSets: { player1: number; player2: number } | null;
    } | null>
  >;
  clearPendingEdit?: () => void;
  updateScoreContext?: (score: ScoringState) => void;
  close: () => void;
}

export function useSessionManager(ctx: SessionManagerContext) {
  const {
    matchId,
    match,
    fetchMatch,
    persistState,
    sessionIdRef,
    tokenRef,
    engineRef,
    setScoreState,
    setSessionActive,
    setSuspendedSession,
    suspendedSession,
    setFloorCurrentSets,
    setBallExchangeCount,
    setPendingEditScore,
  } = ctx;

  const abandonCurrentSession = useCallback(
    async (snapshot?: string) => {
      const sid = sessionIdRef.current;
      const mid = matchId;
      if (!sid || !mid) return;
      if (!engineRef.current) return;

      const state = engineRef.current.getState();
      const isFinished = state.isFinished;
      const stateSnapshot = snapshot ?? engineRef.current.serialize();

      try {
        if (isFinished) {
          // If the match is finished, we MUST end the session as COMPLETED
          // and also mark the match as FINISHED so it's removed from suspended
          // sessions and becomes immutable.
          await Promise.all([
            fetch(`/api/matches/${mid}/sessions/${sid}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokenRef.current}`,
              },
              body: JSON.stringify({
                status: "COMPLETED",
                finalState: state,
              }),
            }),
            fetch(`/api/matches/${mid}/state`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokenRef.current}`,
              },
              body: JSON.stringify({
                state: "FINISHED",
                scoreState: state,
              }),
            }),
          ]);
        } else {
          // Otherwise, just mark as abandoned (standard flow)
          await fetch(`/api/matches/${mid}/sessions/${sid}/abandon`, {
            method: "POST",
            keepalive: true,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokenRef.current}`,
            },
            body: JSON.stringify({ matchStateSnapshot: stateSnapshot }),
          });
        }
      } catch (e) {
        console.error("[abandonCurrentSession] Error:", e);
      }
    },
    [matchId, sessionIdRef, engineRef, tokenRef],
  );

  const handleEditScore = useCallback(
    async (setResults: SetEditData[], server: "player1" | "player2") => {
      const parseP = (v: number | string): number => {
        if (typeof v === "string") {
          if (v === "AD") return 4;
          if (v === "DEUCE") return 3;
          const n = parseInt(v, 10);
          if (n === 40) return 3;
          if (n === 30) return 2;
          if (n === 15) return 1;
          return 0;
        }
        if (v === 40) return 3;
        if (v === 30) return 2;
        if (v === 15) return 1;
        return v;
      };

      const completedSetsProcessed = setResults.filter((set) => !set.isPartial);
      const p1Sets = completedSetsProcessed.filter(
        (set) => set.p1Games > set.p2Games,
      ).length;
      const p2Sets = completedSetsProcessed.filter(
        (set) => set.p2Games > set.p1Games,
      ).length;
      const setsWon = { player1: p1Sets, player2: p2Sets };

      if (suspendedSession) {
        const bankSetsWon = suspendedSession.bankScoreState?.setsWon ?? {
          player1: 0,
          player2: 0,
        };
        if (
          setsWon.player1 < bankSetsWon.player1 ||
          setsWon.player2 < bankSetsWon.player2
        ) {
          alert("Cannot reduce the number of sets already won.");
          return;
        }
      }

      const partialSet = setResults.find((set) => set.isPartial);
      const setsToWin = setsToWinForFormat(
        (match?.format as TennisFormat) || "BEST_OF_3",
      );
      const winner =
        setsWon.player1 >= setsToWin
          ? "player1"
          : setsWon.player2 >= setsToWin
            ? "player2"
            : null;
      const isFinished = winner !== null;

      const newState: ScoringState = {
        sets: setResults.map((set) => ({
          player1: set.p1Games,
          player2: set.p2Games,
          isTiebreak: set.p1Games === 6 && set.p2Games === 6,
          tiebreakScore: set.tiebreakScore ?? null,
        })),
        currentGame: {
          player1: partialSet
            ? parseP(partialSet.currentGamePoints?.player1 ?? 0)
            : 0,
          player2: partialSet
            ? parseP(partialSet.currentGamePoints?.player2 ?? 0)
            : 0,
          isDeuce: false,
          advantage: null,
          secondServe: false,
        },
        server,
        setsWon,
        isFinished,
        winner,
        startedAt: Date.now(),
        secondServe: false,
      };

      if (engineRef.current) {
        engineRef.current.loadState(newState);
        setScoreState(newState);
      }
      await persistState(newState, "edit-score");

      // Force session reset to resolve SEQUENCE_CONFLICT
      // By abandoning the current session and clearing the active state,
      // the next point will start a fresh session with the correct sequence
      await abandonCurrentSession();
      setSessionActive(false);

      setPendingEditScore(null);
      ctx.clearPendingEdit?.();
      ctx.close();
    },
    [
      match,
      engineRef,
      setScoreState,
      setSessionActive,
      setPendingEditScore,
      suspendedSession,
      persistState,
      abandonCurrentSession,
    ],
  );

  // ─── Beforeunload beacon ───────────────────────────────────────────────────

  useEffect(() => {
    const doAbandon = () => {
      const sid = sessionIdRef.current;
      if (!sid) return;
      const state = engineRef.current?.getState();
      if (!state || state.isFinished) return;
      const snapshot = engineRef.current?.serialize() ?? JSON.stringify(state);
      sessionStorage.setItem("last_abandon_timestamp", Date.now().toString());
      const token = tokenRef.current ?? sessionStorage.getItem("access_token");
      // sendBeacon cannot send Authorization headers; fetch+keepalive survives
      // page unloads and correctly authenticates the abandon request.
      fetch(`/api/matches/${matchId}/sessions/${sid}/abandon`, {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ matchStateSnapshot: snapshot }),
      }).catch(() => {});
    };
    window.addEventListener("beforeunload", doAbandon);
    window.addEventListener("pagehide", doAbandon);
    return () => {
      window.removeEventListener("beforeunload", doAbandon);
      window.removeEventListener("pagehide", doAbandon);
      doAbandon();
    };
  }, [matchId, sessionIdRef, engineRef, tokenRef]);

  // ─── Suspended session resume ──────────────────────────────────────────────

  useEffect(() => {
    if (!suspendedSession || !match) return;
    let ignored = false;

    (async () => {
      try {
        const config = {
          format: match.format as any,
          player1Id: match.player1.id,
          player2Id: match.player2.id,
          initialServerId: match.initialServerId || match.player1.id,
        };

        if (suspendedSession.snapshotStatus === "SNAPSHOT_AHEAD") {
          const session = await startSession(matchId, false);
          sessionIdRef.current = session.id;
          setSessionActive(true);

          if (suspendedSession.matchStateSnapshot) {
            const parsed = JSON.parse(suspendedSession.matchStateSnapshot);
            const history: any[] = Array.isArray(parsed?.history)
              ? parsed.history
              : [];
            const offlinePoints = history.slice(
              suspendedSession.bankPointCount,
            );
            for (const entry of offlinePoints) {
              try {
                await fetch(`/api/matches/${matchId}/point`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    authorization: `Bearer ${tokenRef.current}`,
                  },
                  body: JSON.stringify({
                    winnerId: entry.point?.winnerId,
                    type: entry.point?.type,
                    serverId: entry.point?.serverId,
                    isFirstServe: entry.point?.isFirstServe ?? true,
                    isSecondServe: entry.point?.isSecondServe ?? false,
                    timestamp: entry.point?.timestamp ?? Date.now(),
                    ...(entry.point?.rallyDetails != null
                      ? { rallyDetails: entry.point.rallyDetails }
                      : {}),
                    ...(entry.point?.rallyLength != null
                      ? { rallyLength: entry.point.rallyLength }
                      : {}),
                  }),
                });
              } catch {}
            }

            await fetchMatch(true);
            const freshRes = await fetch(`/api/matches/${matchId}`, {
              headers: { authorization: `Bearer ${tokenRef.current}` },
            });
            if (freshRes.ok) {
              const freshData: MatchData = await freshRes.json();
              if (freshData.scoreState) {
                engineRef.current = ScoringEngine.fromSerialized(
                  config,
                  JSON.stringify(freshData.scoreState),
                );
                setScoreState(engineRef.current.getState() as ScoringState);
              }
            }
          }
        } else {
          const session = await startSession(matchId, false);
          sessionIdRef.current = session.id;
          setSessionActive(true);

          if (suspendedSession.matchStateSnapshot) {
            engineRef.current = ScoringEngine.fromSerialized(
              config,
              suspendedSession.matchStateSnapshot,
            );

            const canonicalState =
              suspendedSession.bankScoreState ?? match.scoreState;
            const canonicalVersion = suspendedSession.bankPointCount;
            if (canonicalState) {
              engineRef.current.reconcileWithCanonicalState(
                canonicalState,
                canonicalVersion,
              );
              setScoreState(canonicalState);
            } else {
              const restored = engineRef.current.getState() as ScoringState;
              setScoreState(restored);
            }
          } else if (suspendedSession.bankScoreState) {
            // FIX Bug 2 (secondary path): when only bankScoreState is present
            // (no snapshot), load it directly so engine and UI are in sync.
            engineRef.current = ScoringEngine.fromSerialized(
              config,
              JSON.stringify(suspendedSession.bankScoreState),
            );
            setScoreState(engineRef.current.getState() as ScoringState);
          }
          setBallExchangeCount(0);
        }

        if (!ignored) {
          const engineState =
            engineRef.current?.getState() as ScoringState | null;
          const lastSet = engineState?.sets?.[engineState.sets.length - 1];
          const currentFloorSets = lastSet
            ? { player1: lastSet.player1, player2: lastSet.player2 }
            : suspendedSession.bankScoreState?.sets?.[
                  suspendedSession.bankScoreState.sets.length - 1
                ]
              ? {
                  player1:
                    suspendedSession.bankScoreState.sets[
                      suspendedSession.bankScoreState.sets.length - 1
                    ].player1,
                  player2:
                    suspendedSession.bankScoreState.sets[
                      suspendedSession.bankScoreState.sets.length - 1
                    ].player2,
                }
              : null;
          setFloorCurrentSets(currentFloorSets);
          setSuspendedSession(null);
        }
      } catch {
        console.error("[suspended session resume] Error:", "Erro ao retomar.");
      }
    })();

    return () => {
      ignored = true;
    };
  }, [
    suspendedSession,
    match,
    matchId,
    fetchMatch,
    sessionIdRef,
    tokenRef,
    engineRef,
    setScoreState,
    setSessionActive,
    setSuspendedSession,
    setFloorCurrentSets,
    setBallExchangeCount,
    setPendingEditScore,
  ]);

  return { abandonCurrentSession, handleEditScore };
}
