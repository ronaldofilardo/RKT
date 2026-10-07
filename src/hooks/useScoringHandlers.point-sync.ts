"use client";

import type { PointFlow, ScoringState } from "@/core/scoring/types";
import type { MatchData } from "./useScoringHandlers";
import type { QueuedAction } from "@/schemas/contracts";
import { logger } from "@/lib/logger";
import { TIMEOUTS } from "@/lib/constants";

interface PointSyncConfig {
  matchId: string;
  match: MatchData | null;
  tokenRef: React.MutableRefObject<string | null>;
  pointSequenceRef: React.MutableRefObject<number>;
  setError: (error: string) => void;
}

interface PointSyncResult {
  success: boolean;
  needsResync?: boolean;
  serverResponse?: ServerResponse;
  needsLogin?: boolean;
}

interface ServerResponse {
  scoreState?: ScoringState;
  version?: number;
  pointLogId?: string;
}

interface VersionConflictBody {
  error?: string;
  expectedSequence?: number;
}

interface ErrorResponseBody {
  error?: string;
  message?: string;
}

function buildPointPayload(
  flow: PointFlow,
  sequenceNumber: number,
  clientEventId?: string,
) {
  return {
    winnerId: flow.winnerId,
    type: flow.type,
    serverId: flow.serverId,
    timestamp: flow.timestamp ?? Date.now(),
    sequenceNumber,
    clientEventId: clientEventId ?? (
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    ),
    rallyDetails: flow.rallyDetails ?? undefined,
    rallyLength: flow.rallyLength ?? undefined,
    isFirstServe: flow.isFirstServe ?? undefined,
    isSecondServe: flow.isSecondServe ?? undefined,
    firstFaultDetail: flow.firstFaultDetail ?? undefined,
  };
}

async function handleSuccessResponse(res: Response): Promise<PointSyncResult> {
  try {
    const data = await res.json();
    return {
      success: true,
      needsResync: false,
      serverResponse: data,
    };
  } catch (err) {
    logger.point.parseResponseError(err);
    return { success: true, needsResync: false };
  }
}

async function handleConflictResponse(
  res: Response,
  pointSequenceRef: React.MutableRefObject<number>,
  setError: (msg: string) => void,
): Promise<PointSyncResult> {
  try {
    const errData = (await res.json()) as VersionConflictBody;
    if (errData.error === "SEQUENCE_CONFLICT" && errData.expectedSequence) {
      pointSequenceRef.current = errData.expectedSequence - 1;
    }
  } catch (e) {
    logger.warn("[syncPointToServer] Falha ao parsear body do 409:", e);
  }
  setError("Conflito de sequência — sincronizando...");
  return { success: false, needsResync: true };
}

async function handleErrorResponse(
  res: Response,
  setError: (msg: string) => void,
): Promise<PointSyncResult> {
  let errorMsg = `Erro ao registrar ponto (${res.status})`;
  try {
    const errData = (await res.json()) as ErrorResponseBody;
    logger.point.responseError(res.status, errData);
    if (errData.error) {
      errorMsg = `Erro: ${errData.error} — ${errData.message || "sincronizando..."}`;
    }
  } catch (e) {
    const text = await res.text();
    logger.point.responseErrorText(res.status, text);
  }
  setError(errorMsg);
  return { success: false, needsResync: true };
}

async function handleUnauthorizedResponse(
  setError: (msg: string) => void,
): Promise<PointSyncResult> {
  setError("Sessão expirada — o ponto foi salvo localmente. Faça login novamente para sincronizar.");
  return { success: false, needsResync: false, needsLogin: true };
}

function handleFetchCatch(err: unknown, setError: (msg: string) => void): PointSyncResult {
  if (err instanceof Error && err.name === "AbortError") {
    logger.point.requestTimeout();
    setError("Tempo esgotado — sincronizando placar...");
  } else {
    logger.point.requestError(err);
    setError("Erro de conexão — sincronizando...");
  }
  return { success: false, needsResync: true };
}

export function createPointSyncService(config: PointSyncConfig) {
  const { matchId, match, tokenRef, pointSequenceRef, setError } = config;

  const syncPointToServer = async (
    flow: PointFlow,
    sequenceNumber: number,
    clientEventId?: string,
  ): Promise<PointSyncResult> => {
    if (!match) {
      return { success: false, needsResync: true };
    }

    const payload = buildPointPayload(flow, sequenceNumber, clientEventId);
    logger.point.request(payload);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.POINT_REQUEST_ABORT_MS);
    if (typeof timeoutId === 'object' && timeoutId !== null && 'unref' in timeoutId) {
      timeoutId.unref();
    }

    try {
      const res = await fetch(`/api/matches/${matchId}/point`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${tokenRef.current}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }).catch(() => null);

      if (!res) {
        return { success: false, needsResync: true };
      }

      if (res.ok) {
        return await handleSuccessResponse(res);
      }

      if (res.status === 409) {
        return await handleConflictResponse(res, pointSequenceRef, setError);
      }

      if (res.status === 401) {
        return await handleUnauthorizedResponse(setError);
      }

      return await handleErrorResponse(res, setError);
    } catch (err) {
      return handleFetchCatch(err, setError);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const queuePointForOffline = async (
        enqueue: (action: Omit<QueuedAction, "id" | "status" | "retries">) => Promise<QueuedAction>,
    flow: PointFlow,
  ): Promise<QueuedAction> => {
    return enqueue({

      matchId,
      type: "POINT",
      payload: flow as never,
      timestamp: Date.now(),
    });
  };

  return {
    syncPointToServer,
    queuePointForOffline,
  };
}
