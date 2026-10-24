import { isDevelopment, devLog } from "./logger-dev.helpers";

export const pointLogger = {
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
  matchAlreadyFinished: (winner?: string) => console.error("[POINT] Match already finished, winner:", winner ?? "unknown"),
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
};
