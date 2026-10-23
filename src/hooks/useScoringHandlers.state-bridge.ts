"use client";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ScoringHandlersContext } from "./useScoringHandlers.types";
import { createMatchFetchService } from "./useScoringHandlers.match-fetch";

export function useStateBridge(ctx: ScoringHandlersContext) {
  const {
    matchId,
    match,
    engineRef,
    tokenRef,
    openRef,
    pointSequenceRef,
    setMatch,
    setScoreState,
    setIsLoading,
    setPointsHistory,
    setError,
    isProcessingRef,
    debounceTimerRef,
  } = ctx;

  const matchVersionRef = useRef<number | null>(match?.version ?? null);
  const lastPointLogIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (match?.version !== undefined && match?.version !== null) {
      matchVersionRef.current = match.version;
    }
  }, [match?.version]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      isProcessingRef.current = false;
    };
  }, [debounceTimerRef, isProcessingRef]);

  const matchFetchService = useMemo(
    () =>
      createMatchFetchService({
        matchId,
        tokenRef,
        matchVersionRef,
        pointSequenceRef,
        engineRef,
        openRef,
        setMatch,
        setScoreState,
        setPointsHistory,
        setIsLoading,
        setError,
      }),
    [
      matchId,
      tokenRef,
      matchVersionRef,
      pointSequenceRef,
      engineRef,
      openRef,
      setMatch,
      setScoreState,
      setPointsHistory,
      setIsLoading,
      setError,
    ],
  );

  const fetchMatch = useCallback(
    async (forceEngineReset = false) => {
      await matchFetchService.fetchMatch(forceEngineReset);
    },
    [matchFetchService],
  );

  useEffect(() => {
    const completeSyncCycle = () => {
      fetchMatch(true);
    };
    window.addEventListener("offline-sync-complete", completeSyncCycle);
    return () => {
      window.removeEventListener("offline-sync-complete", completeSyncCycle);
    };
  }, [fetchMatch]);

  return { fetchMatch, matchVersionRef, lastPointLogIdRef };
}
