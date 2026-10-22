import type { ScoringEngine } from "@/core/scoring/engine";
import type { HistoryEntry, ScoringState } from "@/core/scoring/types";
import { persistStateWithRetry } from "./useScoringHandlers.persistence";
import type { MatchData } from "./useScoringHandlers.types";

interface PersistStateOptions {
  allowScoreEdit?: boolean;
  isManualScoreEdit?: boolean;
  voidPointLogId?: string;
  voidLastPoint?: boolean;
  isUndo?: boolean;
  history?: HistoryEntry[];
  note?: string;
}

interface PersistStateResult {
  success: boolean;
  needsResync?: boolean;
  conflict?: boolean;
  version?: number;
}

interface PersistStateServiceDeps {
  matchId: string;
  match: MatchData | null;
  engineRef: React.MutableRefObject<ScoringEngine | null>;
  matchVersionRef: React.MutableRefObject<number | null>;
  tokenRef: React.MutableRefObject<string | null>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  fetchMatch: (forceReset?: boolean) => Promise<void>;
  setMatch: React.Dispatch<React.SetStateAction<MatchData | null>>;
}

export function createPersistStateService({
  matchId,
  match,
  engineRef,
  matchVersionRef,
  tokenRef,
  setError,
  fetchMatch,
  setMatch,
}: PersistStateServiceDeps) {
  const persistState = async (
    state: ScoringState,
    label: string,
    persistOptions?: PersistStateOptions,
  ): Promise<PersistStateResult> => {
    const engineAny = engineRef.current as
      | ({
          getPointHistory?: () => HistoryEntry[];
        } & typeof engineRef.current)
      | null;
    const history = persistOptions?.history !== undefined
      ? persistOptions.history
      : engineAny?.getPointHistory?.();

    const currentVersion = matchVersionRef.current ?? match?.version;
    const matchToUse = match ? { ...match, version: currentVersion } : null;

    const result = await persistStateWithRetry(state, label, {
      matchId,
      match: matchToUse,
      tokenRef,
      setError,
      fetchMatch,
      allowScoreEdit: persistOptions?.allowScoreEdit,
      isManualScoreEdit: persistOptions?.isManualScoreEdit,
      note: persistOptions?.note,
      voidPointLogId: persistOptions?.voidPointLogId,
      voidLastPoint: persistOptions?.voidLastPoint,
      isUndo: persistOptions?.isUndo ?? (label === "undo" || label === "undo-retry"),
      history,
    });

    if (result.success && result.version !== undefined) {
      matchVersionRef.current = result.version;
      setMatch((prev) =>
        prev ? { ...prev, version: result.version } : prev,
      );
    }

    return result;
  };

  return { persistState };
}
