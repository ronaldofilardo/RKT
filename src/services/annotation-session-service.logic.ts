import type { AnnotationSession } from "@/schemas/contracts";
import { logger } from "@/lib/logger";
import { createRequestFn, type SessionServiceConfig } from "./annotation-session-request.logic";

export function createSessionService(config: SessionServiceConfig) {
  const makeRequest = createRequestFn(config);

  return {
    listSessions: (matchId: string): Promise<AnnotationSession[]> =>
      makeRequest(`/matches/${matchId}/sessions`, {}, "Failed to list sessions"),

    startSession: (
      matchId: string,
      autoStarted = false
    ): Promise<AnnotationSession> =>
      makeRequest(
        `/matches/${matchId}/sessions`,
        {
          method: "POST",
          body: JSON.stringify({ autoStarted }),
        },
        "Failed to start session"
      ),

    endSession: (
      matchId: string,
      sessionId: string,
      finalState?: unknown,
      status: "COMPLETED" | "ABANDONED" = "ABANDONED"
    ): Promise<AnnotationSession> =>
      makeRequest(
        `/matches/${matchId}/sessions/${sessionId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
            ...(finalState ? { finalState } : {}),
          }),
        },
        "Failed to end session"
      ),

    endorseSession: (matchId: string, sessionId: string): Promise<unknown> =>
      makeRequest(
        `/matches/${matchId}/sessions/${sessionId}/endorse`,
        {
          method: "POST",
          body: JSON.stringify({}),
        },
        "Failed to endorse session"
      ),

    renewSession: (matchId: string, sessionId: string): Promise<unknown> =>
      makeRequest(
        `/matches/${matchId}/sessions/${sessionId}/renew`,
        {
          method: "POST",
          body: JSON.stringify({}),
        },
        "Failed to renew session"
      ),

    markSessionAbandoned: async (
      params: {
        matchId: string;
        sessionId: string;
        matchStateSnapshot?: string;
      }
    ): Promise<boolean> => {
      const { matchId, sessionId, matchStateSnapshot } = params;
            const url = `${config.baseUrl}/matches/${matchId}/sessions/${sessionId}/abandon`;

      try {
        const response = await fetch(url, {
          method: "POST",
          keepalive: true,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ matchStateSnapshot }),
        });

        if (!response.ok) {
          logger.session.abandonFailed(matchId, sessionId, `[SessionService] markSessionAbandoned failed: ${response.status}`);
          return false;
        }

        return true;
      } catch (error) {
        logger.session.abandonFailed(matchId, sessionId, error);
        return false;
      }
    },
  };
}
