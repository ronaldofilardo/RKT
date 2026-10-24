import { devLog } from "./logger-dev.helpers";

export const matchLogger = {
  created: (currentUserId: string) =>
    devLog("[MATCH CREATE] userId from RLS context:", currentUserId),
};

export const sessionLogger = {
  listing: (userId: string, suspendedMatchIds: string[]) =>
    devLog("[suspended-sessions API] user.id:", userId, "suspendedMatchIds:", suspendedMatchIds),
  snapshotLoading: (matchId: string, scoreState: unknown, scoreStateStr: string) =>
    devLog("[suspended-sessions API] match", matchId, "scoreState:", scoreState, "scoreStateStr:", scoreStateStr),
  snapshotParsed: (snapshot: unknown) =>
    devLog("[suspended-sessions API] parsed snapshot:", snapshot),
  snapshotParseFailed: (e: unknown) =>
    console.error("[suspended-sessions API] failed to parse:", e),
  listingStart: (count: number) => devLog("[suspended-sessions API] listing", count, "sessions"),
  abandonSucceeded: (matchId: string, sessionId: string) =>
    devLog("[annotationSession] abandon synced", matchId, sessionId),
  abandonFailed: (matchId: string, sessionId: string, reason: unknown) =>
    console.warn("[annotationSession] abandon failed", matchId, sessionId, reason),
};

export const syncLogger = {
  starting: (count: number) => devLog(`Syncing ${count} pending match(es)...`),
  success: (matchId: string) => devLog(`Successfully synced match ${matchId}`),
  allComplete: () => devLog("All pending matches synced successfully!"),
  someFailed: (count: number) => console.warn(`${count} match(es) still pending sync`),
  failed: (matchId: string, err: unknown) =>
    console.error(`Failed to sync match ${matchId}:`, err),
  connectionRestored: () => devLog("Connection restored, attempting sync..."),
};

export const persistLogger = {
  conflict: (label: string, serverVersion: unknown, clientVersion: unknown) =>
    console.info(
      `[persistState:${label}] Conflito de versão detectado (servidor v${serverVersion ?? "?"}, cliente v${clientVersion ?? "?"}). Re-sincronizando...`,
    ),
  refetchFailed: (label: string, err: unknown) =>
    console.error(`[persistState:${label}] Failed to refetch match after conflict:`, err),
  httpError: (label: string, status: number, body: unknown) =>
    console.error(`[persistState:${label}] HTTP ${status} body:`, body),
  attemptFailed: (label: string, attempt: number, maxRetries: number, err: unknown) =>
    console.error(`[persistState:${label}] Attempt ${attempt}/${maxRetries} failed:`, err),
  maxRetriesExhausted: (label: string) =>
    console.error(`[persistState:${label}] Max retries exhausted`),
  retrying: (label: string, delay: number) =>
    devLog(`[persistState:${label}] Retrying in ${delay}ms...`),
};
