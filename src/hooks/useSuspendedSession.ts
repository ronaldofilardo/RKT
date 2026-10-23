"use client";
import { logger } from "@/lib/logger";

import { useEffect, useRef } from "react";
import { buildEngineConfig } from "@/core/scoring/engine-config";
import type { SuspendedSessionConfig } from "./suspended-session.types";
import { resumeFromSnapshotAhead, resumeFromBankAhead } from "./suspended-resume-logic";
import { cleanupAfterResume } from "./suspended-cleanup.logic";

export type { SuspendedSessionConfig } from "./suspended-session.types";

export function useSuspendedSession(config: SuspendedSessionConfig) {
  const {
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
    clearPendingEdit,
    startSession,
  } = config;

  const resumedSessionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!suspendedSession || !match) return;
    const sessionKey = `${matchId}-${suspendedSession.snapshotStatus}-${suspendedSession.snapshotPointCount}-${suspendedSession.bankPointCount}`;
    if (resumedSessionKeyRef.current === sessionKey) return;
    resumedSessionKeyRef.current = sessionKey;
    let ignored = false;
    const controller = new AbortController();

    const resumeCtx = {
      suspendedSession, match, matchId, fetchMatch, sessionIdRef, tokenRef,
      engineRef, setScoreState, setSessionActive, startSession,
    };
    const cleanupCtx = { engineRef, suspendedSession, match, setFloorCurrentSets, setSuspendedSession };

    (async () => {
      try {
        const engineConfig = buildEngineConfig(match);

        if (suspendedSession.snapshotStatus === "SNAPSHOT_AHEAD") {
          await resumeFromSnapshotAhead(resumeCtx, engineConfig, controller.signal);
        } else {
          await resumeFromBankAhead(resumeCtx, engineConfig);
        }

        if (!ignored) {
          cleanupAfterResume(cleanupCtx);
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        logger.error("[suspended session resume] Error:", "Erro ao retomar.", err);
        if (!ignored) {
          cleanupAfterResume(cleanupCtx);
        }
      }
    })();

    return () => {
      ignored = true;
      controller.abort();
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
    clearPendingEdit,
    startSession,
  ]);
}
