"use client";

import type { PointFlow } from "@/core/scoring/types";
import { buildPointPayload } from "@/core/scoring/point-payload";
import type { QueuedAction } from "@/schemas/contracts";
import { logger } from "@/lib/logger";
import { TIMEOUTS } from "@/lib/constants";
import type { PointSyncConfig, PointSyncResult } from "./point-sync.types";
import {
  respondWithApiSuccess,
  respondWithConflict,
  respondWithApiError,
  respondUnauthorized,
  reportFetchFailure,
} from "./point-sync-responders.logic";

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
        return await respondWithApiSuccess(res);
      }

      if (res.status === 409) {
        return await respondWithConflict(res, pointSequenceRef, setError);
      }

      if (res.status === 401) {
        return await respondUnauthorized(setError);
      }

      return await respondWithApiError(res, setError);
    } catch (err) {
      return reportFetchFailure(err, setError);
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

export type { PointSyncConfig, PointSyncResult, ServerResponse } from "./point-sync.types";
