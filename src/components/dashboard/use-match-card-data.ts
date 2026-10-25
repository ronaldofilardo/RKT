'use client';

import { useMemo } from 'react';
import { normalizeScoreState, isMatchTiebreakFormat, isCurrentSetMatchTiebreak, type TennisFormat, type NormalizedScoreState, type SetCellScore } from './match-card.logic';
import type { DashboardMatchPayload } from './match-card-types';

const COURT_COLORS: Record<string, { bar: string; score: string }> = {
  CLAY:  { bar: 'rgb(var(--telemetry-court-clay, 196 98 58))', score: 'rgb(var(--telemetry-court-clay, 196 98 58) / 0.7)' },
  GRASS: { bar: 'rgb(var(--telemetry-court-grass, 45 138 62))', score: 'rgb(var(--telemetry-court-grass, 45 138 62) / 0.7)' },
  HARD:  { bar: 'rgb(var(--telemetry-court-hard, 30 77 123))', score: 'rgb(var(--telemetry-court-hard, 30 77 123) / 0.7)' },
};
const DEFAULT_COURT_COLOR = { bar: 'rgb(var(--telemetry-court-hard, 30 77 123))', score: 'rgb(var(--telemetry-court-hard, 30 77 123) / 0.7)' };

export function useMatchCardData(match: DashboardMatchPayload) {
  const isSuspendedAnnotation = Boolean(match.suspendedSessionId);
  const isLiveOrSuspended =
    match.state === 'IN_PROGRESS' || isSuspendedAnnotation || Boolean(match.suspendedSessionId);
  const isFinished = match.state === 'FINISHED';
  const isScheduled = match.state === 'SCHEDULED';

  const scoreState = useMemo<NormalizedScoreState | null>(() => {
    if (match.scoreSummary) return match.scoreSummary as NormalizedScoreState;
    const fromScoreState = normalizeScoreState(match.scoreState, match.format as TennisFormat);
    if (fromScoreState) return fromScoreState;
    return normalizeScoreState(match.matchStateSnapshot, match.format as TennisFormat);
  }, [match.scoreSummary, match.scoreState, match.matchStateSnapshot, match.format]);

  const suspendedAnnotationScore = useMemo(() => {
    if (!match.matchStateSnapshot) return null;
    try {
      const raw = JSON.parse(match.matchStateSnapshot);
      return raw?.state && Array.isArray(raw?.history) ? raw.state : raw;
    } catch {
      return null;
    }
  }, [match.matchStateSnapshot]);

  // No formato SHORT_SET_2V2_NO_AD, uma partida começa os dois sets em 2x2.
  // Enquanto a partida não estiver finalizada e houver apenas 1 set registrado,
  // projetamos visualmente o segundo set começando em 2x2.
  const displayedSets = useMemo<SetCellScore[]>(() => {
    const rawSets = scoreState?.sets || [];
    if (match.format === 'SHORT_SET_2V2_NO_AD' && !isFinished) {
      const placeholder: SetCellScore = { player1: 2, player2: 2, isTiebreak: false, tiebreakScore: null };
      if (rawSets.length === 0) return [placeholder, placeholder];
      if (rawSets.length === 1) return [rawSets[0], placeholder];
    }
    return rawSets;
  }, [scoreState?.sets, match.format, isFinished]);

  const currentServer = useMemo(() => {
    const s = scoreState?.server || suspendedAnnotationScore?.server;
    if (s === 'player1' || s === 'player2') return s;
    if (s && match.player1?.id && s === match.player1.id) return 'player1';
    if (s && match.player2?.id && s === match.player2.id) return 'player2';
    if (match.initialServerId) {
      if (match.player1?.id && match.player1.id === match.initialServerId) return 'player1';
      if (match.player2?.id && match.player2.id === match.initialServerId) return 'player2';
    }
    return null;
  }, [scoreState, suspendedAnnotationScore, match.initialServerId, match.player1, match.player2]);

  const showServer = !isFinished && !isScheduled && Boolean(currentServer);
  const hasScore = scoreState != null || suspendedAnnotationScore != null;
  const isCurrentSetMT = isMatchTiebreakFormat(match.format) && displayedSets.length > 0
    ? isCurrentSetMatchTiebreak(displayedSets, match.format as TennisFormat)
    : false;
  const lastSet = displayedSets.length > 0 ? displayedSets[displayedSets.length - 1] : null;
  const lastSetTiebreakScore =
    !isCurrentSetMT && lastSet?.isTiebreak && lastSet?.tiebreakScore ? lastSet.tiebreakScore : null;

  const courtColors = COURT_COLORS[match.courtType ?? ''] ?? DEFAULT_COURT_COLOR;

  return {
    isSuspendedAnnotation,
    isLiveOrSuspended,
    isFinished,
    scoreState,
    suspendedAnnotationScore,
    hasScore,
    displayedSets,
    isServerP1: showServer && currentServer === 'player1',
    isServerP2: showServer && currentServer === 'player2',
    isCurrentSetMT,
    lastSetTiebreakScore,
    barBg: isSuspendedAnnotation ? 'rgb(var(--telemetry-alert, 245 158 11))' : courtColors.bar,
    scoreBg: isSuspendedAnnotation ? 'rgb(var(--telemetry-alert, 217 119 6) / 0.7)' : courtColors.score,
    setsWonP1: scoreState?.setsWon?.player1 ?? 0,
    setsWonP2: scoreState?.setsWon?.player2 ?? 0,
  };
}
