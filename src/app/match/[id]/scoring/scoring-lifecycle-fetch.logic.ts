"use client";

import { useEffect, useRef } from "react";
import type { ScoringPageHandlers } from "./useScoringPageEffects";

type FetchState = {
  matchId: string;
  viewMode: string;
  fetchTimelinePoints?: () => Promise<void> | void;
  fetchPointLogAudioMeta: () => Promise<void> | void;
  fetchComments: () => Promise<void> | void;
};

export function useInitialScoringFetch(
  { matchId, fetchTimelinePoints }: FetchState,
  fetchMatch: ScoringPageHandlers["fetchMatch"],
): void {
  const initialFetchDoneRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialFetchDoneRef.current !== matchId) {
      initialFetchDoneRef.current = matchId;
      fetchMatch();
      fetchTimelinePoints?.();
    }
  }, [matchId, fetchMatch, fetchTimelinePoints]);
}

export function useViewModeFetch(state: FetchState): void {
  const { viewMode, fetchTimelinePoints, fetchPointLogAudioMeta, fetchComments } = state;
  const prevViewModeRef = useRef(viewMode);
  useEffect(() => {
    if (viewMode === "timeline" && prevViewModeRef.current !== "timeline") {
      fetchTimelinePoints?.();
      fetchPointLogAudioMeta();
      fetchComments();
    }
    prevViewModeRef.current = viewMode;
  }, [viewMode, fetchTimelinePoints, fetchPointLogAudioMeta, fetchComments]);
}
