"use client";

import type { PointFlow } from "@/core/scoring/types";
import type { MatchData } from "./useScoringHandlers";
import type { QueuedAction } from "@/schemas/contracts";
import { logger } from "@/lib/logger";
import { TIMEOUTS } from "@/lib/constants";
import {
  createPointPayload,
  enqueueOfflinePoint,
  handleConflictResponse,
  handleErrorResponse,
  handleRequestError,
  readSuccessfulResponse,
  type ServerResponse,
} from './useScoringHandlers.point-sync.helpers';

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


export function createPointSyncService(config: PointSyncConfig) {
  const { matchId, match, tokenRef, pointSequenceRef, setError } = config;

  const syncPointToServer = async (
    flow: PointFlow,
    sequenceNumber: number,
  ): Promise<PointSyncResult> => {
    if (!match) {
      return { success: false, needsResync: true };
    }

    const payload = createPointPayload(flow, sequenceNumber);

    logger.point.request(payload);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.POINT_REQUEST_ABORT_MS);

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
          return readSuccessfulResponse(await res.json());
        } catch (err) {
          logger.point.parseResponseError(err);
          return { success: true, needsResync: false };
        }
      }

      if (res.status === 409) {
        return handleConflictResponse(res, pointSequenceRef, setError);
      }

      return handleErrorResponse(res, setError);
    } catch (err) {
      return handleRequestError(err, setError);
    }
  };

  const queuePointForOffline = async (
    enqueue: (action: Omit<QueuedAction, "id" | "status" | "retries">) => Promise<void>,
    flow: PointFlow,
  ): Promise<void> => {
    await enqueueOfflinePoint(enqueue, matchId, flow);
  };

  return {
    syncPointToServer,
    queuePointForOffline,
  };
}
