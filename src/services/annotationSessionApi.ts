import type { AnnotationSession } from "@/schemas/contracts";
import { logger } from "@/lib/logger";

function validateId(id: string, paramName: string): void {
  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new Error(`[annotationSession] ${paramName} é obrigatório e deve ser uma string não vazia`);
  }
}

async function getSessionToken(): Promise<string | null> {
  return sessionStorage.getItem("access_token");
}

export async function listSessions(matchId: string): Promise<AnnotationSession[]> {
  validateId(matchId, "matchId");
  const token = await getSessionToken();

  const response = await fetch(`/api/matches/${matchId}/sessions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to list sessions");
  }

  return response.json();
}

export async function startSession(
  matchId: string,
  autoStarted = false,
): Promise<AnnotationSession> {
  validateId(matchId, "matchId");
  const token = await getSessionToken();

  const response = await fetch(`/api/matches/${matchId}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ autoStarted }),
  });

  if (!response.ok) {
    throw new Error("Failed to start session");
  }

  return response.json();
}

export async function endSession(
  matchId: string,
  sessionId: string,
  finalState?: unknown,
  status: "COMPLETED" | "ABANDONED" = "ABANDONED",
): Promise<AnnotationSession> {
  validateId(matchId, "matchId");
  validateId(sessionId, "sessionId");
  const token = await getSessionToken();

  const response = await fetch(`/api/matches/${matchId}/sessions/${sessionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      status,
      ...(finalState ? { finalState } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to end session");
  }

  return response.json();
}

export async function endorseSession(matchId: string, sessionId: string): Promise<unknown> {
  validateId(matchId, "matchId");
  validateId(sessionId, "sessionId");
  const token = await getSessionToken();

  const response = await fetch(`/api/matches/${matchId}/sessions/${sessionId}/endorse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error("Failed to endorse session");
  }

  return response.json();
}

export async function markSessionAbandoned({
  matchId,
  sessionId,
  matchStateSnapshot,
}: {
  matchId: string;
  sessionId: string;
  matchStateSnapshot?: string;
}): Promise<{ synced: boolean }> {
  validateId(matchId, "matchId");
  validateId(sessionId, "sessionId");
  const token = await getSessionToken();

  const url = `/api/matches/${matchId}/sessions/${sessionId}/abandon`;

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
      logger.session.abandonFailed(matchId, sessionId, response.status);
      return { synced: false };
    }

    logger.session.abandonSucceeded(matchId, sessionId);
    return { synced: true };
  } catch (err) {
    logger.session.abandonFailed(matchId, sessionId, err);
    return { synced: false };
  }
}
