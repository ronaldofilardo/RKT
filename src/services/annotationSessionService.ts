import type { AnnotationSession } from "@/schemas/contracts";
import { createSessionService } from "./annotation-session-service.logic";

function createClientService(): ReturnType<typeof createSessionService> {
  if (typeof window === "undefined") {
    throw new Error(
      "Session service can only be used client-side. Use createSessionService directly on server."
    );
  }

  return createSessionService({
    baseUrl: "/api",
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

export async function renewSession(matchId: string, sessionId: string): Promise<unknown> {
  return getClientService().renewSession(matchId, sessionId);
}

export async function markSessionAbandoned(params: {
  matchId: string;
  sessionId: string;
  matchStateSnapshot?: string;
}): Promise<boolean> {
  return getClientService().markSessionAbandoned(params);
}

export { createSessionService };
export type { SessionServiceConfig } from "./annotation-session-request.logic";
