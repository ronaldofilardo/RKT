import { ScoringEngine } from "@/core/scoring/engine";
import { buildEngineConfig } from "@/core/scoring/engine-config";
import {
  unwrapEnvelopeWithHistory,
  shouldKeepLocalStateForMissingTiebreak,
} from "@/core/scoring/state-envelope";
import { logger } from "@/lib/logger";
import type { ScoreAction } from "@/hooks/useScoreReducer";
import type { MatchData } from "./useScoringHandlers.types";
import type { createPointSyncService } from "./useScoringHandlers.point-sync";

type ServerResponse = NonNullable<
  Awaited<ReturnType<ReturnType<typeof createPointSyncService>["syncPointToServer"]>>["serverResponse"]
>;

interface ApplySuccessResultDeps {
  engineRef: React.MutableRefObject<ScoringEngine | null>;
  match: MatchData | null;
  matchVersionRef: React.MutableRefObject<number | null>;
  lastPointLogIdRef: React.MutableRefObject<string | null>;
  setScoreState: (action: ScoreAction) => void;
  setMatch: React.Dispatch<React.SetStateAction<MatchData | null>>;
}

export function createApplySuccessResult({
  engineRef,
  match,
  matchVersionRef,
  lastPointLogIdRef,
  setScoreState,
  setMatch,
}: ApplySuccessResultDeps) {
  return (serverResponse: ServerResponse) => {
    const currentHistory = engineRef.current!.getPointHistory();
    const localState = engineRef.current!.getState();
    const rawServerState = serverResponse.scoreState!;

    const { state: serverState, historyToRestore } = unwrapEnvelopeWithHistory(
      rawServerState,
      currentHistory,
    );

    if (shouldKeepLocalStateForMissingTiebreak(localState, serverState)) {
      logger.warn("[applyPoint] server response missing tiebreak info — keeping local state", {
        localSets: localState.sets?.length,
        serverSets: serverState.sets?.length,
      });
    } else {
      setScoreState({ type: "POINT_APPLIED", payload: serverState });
      engineRef.current = ScoringEngine.fromSerialized(
        buildEngineConfig(match!),
        JSON.stringify(serverState),
      );
      engineRef.current.restorePointHistory(historyToRestore);
    }

    if (serverResponse.version !== undefined) {
      matchVersionRef.current = serverResponse.version;
      setMatch((prev) => (prev ? { ...prev, version: serverResponse.version } : prev));
    }

    if (serverResponse.pointLogId) {
      lastPointLogIdRef.current = serverResponse.pointLogId;
    }

    return serverResponse.pointLogId;
  };
}
