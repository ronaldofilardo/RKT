/**
 * Logging service with environment-based filtering
 *
 * Usage:
 * - logger.log() - Development only
 * - logger.info() - Always
 * - logger.warn() - Always
 * - logger.error() - Always
 * - logger.debug() - Development only
 *
 * Namespaced loggers:
 * - logger.point - Point request/response lifecycle
 * - logger.match - Match creation/state transitions
 * - logger.session - Annotation session lifecycle
 * - logger.sync - Offline sync operations
 * - logger.persist - State persistence (undo/redo)
 */

const isDevelopment = process.env.NODE_ENV === "development";

function devLog(...args: unknown[]) {
  if (isDevelopment) {
    console.log(...args);
  }
}

function devDebug(...args: unknown[]) {
  if (isDevelopment) {
    console.debug(...args);
  }
}

export const logger = {
  log: (...args: unknown[]) => devLog(...args),

  info: (...args: unknown[]) => {
    console.info(...args);
  },

  warn: (...args: unknown[]) => {
    console.warn(...args);
  },

  error: (...args: unknown[]) => {
    console.error(...args);
  },

  debug: (...args: unknown[]) => devDebug(...args),

  point: {
    request: (payload: unknown) => {
      if (isDevelopment) {
        console.log("[POINT REQUEST] Payload:", JSON.stringify(payload, null, 2));
      }
    },
    received: (body: unknown) => devLog("[POINT REQUEST] Received payload:", JSON.stringify(body, null, 2)),
    engineCreated: () => devLog("[POINT] Creating engine from match state"),
    normalizedTiebreak: () => devLog("[POINT] Normalizing malformed match tiebreak state"),
    applying: (data: unknown) => devLog("[POINT] Applying point:", data),
    updatingMatch: (info: { version: number; isFinished: boolean }) =>
      devLog("[POINT] Updating match:", info),
    creatingPointLog: (info: { winnerId: string; type: string; rallyLength?: number }) =>
      devLog("[POINT] Creating point log:", info),
    transactionCompleted: () => devLog("[POINT] Transaction completed successfully"),
    newStateSets: (sets: unknown) => devLog("[POINT] New state sets:", JSON.stringify(sets)),
    matchNotFound: (id: string) => console.error("[POINT] Match not found:", id),
    matchNotInProgress: (state: string) => console.error("[POINT] Match not in progress:", state),
    noInitialServer: () => console.error("[POINT] No initial server set"),
    sequenceConflict: (info: { expected: number; received: number }) =>
      console.error("[POINT] Sequence conflict:", info),
    parseError: (e: unknown) => console.error("[POINT] Failed to parse request body:", e),
    validationError: (info: unknown) =>
      console.error("[POINT VALIDATION ERROR]", JSON.stringify(info)),
    responseError: (status: number, body: unknown) =>
      console.error("[POINT RESPONSE ERROR]", status, JSON.stringify(body, null, 2)),
    responseErrorText: (status: number, text: string) =>
      console.error("[POINT RESPONSE ERROR]", status, text),
    requestTimeout: () => console.error("[syncPointToServer] Request timeout"),
    requestError: (err: unknown) => console.error("[syncPointToServer] Request error", err),
    parseResponseError: (err: unknown) => console.error("[syncPointToServer:parse-response]", err),
    api: {
      error: (err: unknown) => console.error("[MATCH POINT]", err),
    },
  },

  match: {
    created: (currentUserId: string) =>
      devLog("[MATCH CREATE] userId from RLS context:", currentUserId),
  },

  session: {
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
  },

  sync: {
    starting: (count: number) => devLog(`Syncing ${count} pending match(es)...`),
    success: (matchId: string) => devLog(`Successfully synced match ${matchId}`),
    allComplete: () => devLog("All pending matches synced successfully!"),
    someFailed: (count: number) => console.warn(`${count} match(es) still pending sync`),
    failed: (matchId: string, err: unknown) =>
      console.error(`Failed to sync match ${matchId}:`, err),
    connectionRestored: () => devLog("Connection restored, attempting sync..."),
  },

  persist: {
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
  },
};
