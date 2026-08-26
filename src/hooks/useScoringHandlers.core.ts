import { useMemo } from "react";
import type { ScoringHandlersContext } from "./useScoringHandlers.types";
import { createServerHelpersService } from "./useScoringHandlers.server-helpers.service";
import { createModalHandlersService } from "./useScoringHandlers.modals.service";
import { createPointSyncService } from './useScoringHandlers.point-sync';
import { createFetchMatch } from './useScoringHandlers.fetch-match';
import { createPointProcessor } from './useScoringHandlers.processor';
import { createStatePersistence } from './useScoringHandlers.persistence-handler';

export function useScoringCore(ctx: ScoringHandlersContext) {
  const { matchId, match, isOnline, enqueue, engineRef, tokenRef, open, openRef, pointSequenceRef, serveErrorState, setMatch, setScoreState, setIsLoading, setError, setPointsHistory, setShowFinishedBanner, isProcessingRef } = ctx;

  // ─── Match data fetch ──────────────────────────────────────────────────────

  const fetchMatch = useMemo(
    () => createFetchMatch({
      matchId,
      tokenRef,
      engineRef,
      openRef,
      pointSequenceRef,
      setMatch,
      setScoreState,
      setIsLoading,
      setError,
      setPointsHistory,
    }),
    [matchId, tokenRef, engineRef, openRef, pointSequenceRef, setMatch, setScoreState, setIsLoading, setError, setPointsHistory],
  );

  // ─── State persistence ────────────────────────────────────────────────────
  // FIX Bug 1/4/6: unificado em uma única função. Não chamar de processPoint
  // (o POST /point já persiste com validação de versão + PointLog); usar
  // apenas em undo/let/edit onde não há endpoint dedicado.

  const persistState = useMemo(
    () => createStatePersistence({
      engineRef,
      matchId,
      match,
      tokenRef,
      setError,
      fetchMatch,
      setMatch: (update) => setMatch(update),
    }),
    [engineRef, matchId, match, tokenRef, setError, fetchMatch, setMatch],
  );

  // ─── Services ─────────────────────────────────────────────────────────────
  const serverHelpers = createServerHelpersService({ engineRef, match });
  const modalService = createModalHandlersService({ serveErrorState, open });
  const pointSync = createPointSyncService({ matchId, match, tokenRef, pointSequenceRef, setError });

  // ─── Core point processing ─────────────────────────────────────────────────

  const processPoint = useMemo(
    () => createPointProcessor({
      engineRef,
      match,
      isProcessingRef,
      isOnline,
      enqueue,
      pointSync,
      pointSequenceRef,
      setScoreState: (state) => setScoreState(state),
      setPointsHistory: (update) => setPointsHistory(update),
      setShowFinishedBanner,
      setError,
      setMatch: (update) => setMatch(update),
      fetchMatch,
    }),
    [engineRef, match, isProcessingRef, isOnline, enqueue, pointSync, pointSequenceRef, setScoreState, setPointsHistory, setShowFinishedBanner, setError, setMatch, fetchMatch],
  );

  return { fetchMatch, persistState, serverHelpers, modalService, processPoint };
}
