"use client";

import type { PointFlow, ScoringState } from "@/core/scoring/types";
import type { MatchData } from "./useScoringHandlers";
import type { QueuedAction } from "@/schemas/contracts";
import { logger } from "@/lib/logger";
import { TIMEOUTS_MS } from "@/lib/constants";

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
}

interface ServerResponse {
  scoreState?: ScoringState;
  version?: number;
}

interface VersionConflictBody {
  error?: string;
  expectedSequence?: number;
}

interface ErrorResponseBody {
  error?: string;
  message?: string;
}

export function createPointSyncService(config: PointSyncConfig) {
  const { matchId, match, tokenRef, pointSequenceRef, setError } = config;

  const syncPointToServer = async (
    flow: PointFlow,
    sequenceNumber: number,
  ): Promise<PointSyncResult> => {
    if (!match) {
      return { success: false, needsResync: true };
    }

    const payload = {
      winnerId: flow.winnerId,
      type: flow.type,
      serverId: flow.serverId,
      timestamp: flow.timestamp ?? Date.now(),
      sequenceNumber,
      rallyDetails: flow.rallyDetails ?? undefined,
      rallyLength: flow.rallyLength ?? undefined,
      isFirstServe: flow.isFirstServe ?? undefined,
      isSecondServe: flow.isSecondServe ?? undefined,
      firstFaultDetail: flow.firstFaultDetail ?? undefined,
    };

    logger.point.request(payload);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS_MS.POINT_REQUEST_ABORT);

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

      clearTimeout(timeoutId);

      if (!res) {
        return { success: false, needsResync: true };
      }

      if (res.ok) {
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

      if (res.status === 409) {
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
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        logger.point.requestTimeout();
        setError("Tempo esgotado ao registrar ponto — verifique sua conexão");
      } else {
        logger.point.requestError(err);
        setError("Erro de conexão ao registrar ponto");
      }
      return { success: false, needsResync: true };
    }
  };

  const queuePointForOffline = async (
    enqueue: (action: Omit<QueuedAction, "id" | "status" | "retries">) => Promise<void>,
    flow: PointFlow,
  ): Promise<void> => {
    await enqueue({
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
