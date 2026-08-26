"use client";

import { useCallback } from "react";
import {
  startSession,
  endSession,
  markSessionAbandoned,
  endorseSession,
} from "./annotationSessionService";

export function useAnnotationSession() {
  const start = useCallback(async (matchId: string, autoStarted = false) => {
    return startSession(matchId, autoStarted);
  }, []);

  const end = useCallback(async (
    matchId: string,
    sessionId: string,
    finalState?: unknown,
    status?: "COMPLETED" | "ABANDONED",
  ) => {
    return endSession(matchId, sessionId, finalState, status);
  }, []);

  const abandon = useCallback(
    async (matchId: string, sessionId: string, matchStateSnapshot: string) => {
      return markSessionAbandoned({ matchId, sessionId, matchStateSnapshot });
    },
    [],
  );

  const endorse = useCallback(async (matchId: string, sessionId: string) => {
    return endorseSession(matchId, sessionId);
  }, []);

  return { start, end, abandon, endorse };
}
