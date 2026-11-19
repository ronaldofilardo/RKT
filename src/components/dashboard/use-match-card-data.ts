'use client';

import { useMemo } from 'react';
import { getMaxSetsForFormat } from '@/components/scoring/scoreboard-card-logic';
import type { TennisFormat, SetCellScore } from './match-card.logic';
import type { DashboardMatchPayload } from './match-card-types';
import { formatProvenance } from '@/core/athlete/provenance';
import {
  resolveScoreState,
  parseSuspendedScore,
  resolveDisplayedSets,
  resolveCurrentServer,
  resolveTiebreakDetails,
  resolveCardTheme,
  padSets,
  resolveServerDisplay,
} from './match-card-data.logic';

export function useMatchCardData(match: DashboardMatchPayload) {
  const isSuspendedAnnotation = Boolean(match.suspendedSessionId);
  const isLiveOrSuspended = match.state === 'IN_PROGRESS' || isSuspendedAnnotation;
  const isFinished = match.state === 'FINISHED';
  const isScheduled = match.state === 'SCHEDULED';

  const scoreState = useMemo(
    () => resolveScoreState(match),
    [match],
  );

  const suspendedAnnotationScore = useMemo(
    () => parseSuspendedScore(match.matchStateSnapshot),
    [match.matchStateSnapshot],
  );

  const displayedSets = useMemo(
    () => resolveDisplayedSets(scoreState?.sets, match.format, isFinished),
    [scoreState?.sets, match.format, isFinished],
  );

  const maxSetsForFormat = getMaxSetsForFormat(match.format as TennisFormat);

  const paddedSets = useMemo<SetCellScore[]>(
    () => padSets(displayedSets, isLiveOrSuspended, isFinished, maxSetsForFormat),
    [displayedSets, isLiveOrSuspended, isFinished, maxSetsForFormat],
  );

  const serverCandidate = scoreState?.server || suspendedAnnotationScore?.server;
  const currentServer = useMemo(
    () => resolveCurrentServer(serverCandidate, match.initialServerId, match),
    [serverCandidate, match],
  );

  const showServer = !isFinished && !isScheduled && Boolean(currentServer);
  const { isServerP1, isServerP2 } = resolveServerDisplay(showServer, currentServer);

  const hasScore = scoreState != null || suspendedAnnotationScore != null;
  const { isCurrentSetMT, lastSetTiebreakScore } = resolveTiebreakDetails(match.format, displayedSets);
  const { barBg, scoreBg } = resolveCardTheme(isSuspendedAnnotation, match.courtType);

  return {
    isSuspendedAnnotation, isLiveOrSuspended, isFinished, scoreState,
    suspendedAnnotationScore, hasScore, displayedSets,
    isServerP1, isServerP2,
    isCurrentSetMT, lastSetTiebreakScore,
    barBg, scoreBg,
    setsWonP1: scoreState?.setsWon?.player1 ?? 0,
    setsWonP2: scoreState?.setsWon?.player2 ?? 0,
    currentGame: scoreState?.currentGame ?? null,
    paddedSets,
    p1Origin: formatProvenance(match.player1.club, match.player1.state),
    p2Origin: formatProvenance(match.player2.club, match.player2.state),
  };
}
