import type { AnnotationSession } from "@/schemas/contracts";
import { logger } from "@/lib/logger";

export interface SessionServiceConfig {
  baseUrl: string;
  getToken: () => Promise<string | null>;
}

function createSessionService(config: SessionServiceConfig) {
  async function makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    errorMessage: string
  ): Promise<T> {
    const token = await config.getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${config.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

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

    markSessionAbandoned: async (
      params: {
        matchId: string;
        sessionId: string;
        matchStateSnapshot?: string;
      }
    ): Promise<boolean> => {
      const { matchId, sessionId, matchStateSnapshot } = params;
      const token = await config.getToken();
      const url = `${config.baseUrl}/matches/${matchId}/sessions/${sessionId}/abandon`;

      try {
        const response = await fetch(url, {
          method: "POST",
          keepalive: true,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

function createClientService(): ReturnType<typeof createSessionService> {
  if (typeof window === "undefined") {
    throw new Error(
      "Session service can only be used client-side. Use createSessionService directly on server."
    );
  }

  return createSessionService({
    baseUrl: "/api",
    getToken: () => Promise.resolve(sessionStorage.getItem("access_token")),
  });
}

let clientServiceInstance: ReturnType<typeof createSessionService> | null = null;

function getClientService(): ReturnType<typeof createSessionService> {
  if (!clientServiceInstance) {
    clientServiceInstance = createClientService();
  }
  return clientServiceInstance;
}

export async function listSessions(matchId: string): Promise<AnnotationSession[]> {
  return getClientService().listSessions(matchId);
}

export async function startSession(matchId: string, autoStarted = false): Promise<AnnotationSession> {
  return getClientService().startSession(matchId, autoStarted);
}

export async function endSession(
  matchId: string,
  sessionId: string,
  finalState?: unknown,
  status: "COMPLETED" | "ABANDONED" = "ABANDONED",
): Promise<AnnotationSession> {
  return getClientService().endSession(matchId, sessionId, finalState, status);
}

export async function endorseSession(matchId: string, sessionId: string): Promise<unknown> {
  return getClientService().endorseSession(matchId, sessionId);
}

export async function markSessionAbandoned(params: {
  matchId: string;
  sessionId: string;
  matchStateSnapshot?: string;
}): Promise<boolean> {
  return getClientService().markSessionAbandoned(params);
}


export { createSessionService };