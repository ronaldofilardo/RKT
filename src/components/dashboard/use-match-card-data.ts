'use client';

import { useMemo } from 'react';
import { normalizeScoreState, isMatchTiebreakFormat, isCurrentSetMatchTiebreak, type TennisFormat, type NormalizedScoreState, type SetCellScore } from './match-card.logic';
import type { DashboardMatchPayload } from './match-card-types';

const COURT_COLORS: Record<string, { bar: string; score: string }> = {
  CLAY:  { bar: '#b5543a', score: '#4a2a1a' },
  GRASS: { bar: '#2d8a3e', score: '#1a4a2a' },
  HARD:  { bar: '#1e4d7b', score: '#1a2a4a' },
};
const DEFAULT_COURT_COLOR = { bar: '#1e4d7b', score: '#1a2a4a' };

export function useMatchCardData(match: DashboardMatchPayload) {
  const isSuspendedAnnotation = Boolean(match.suspendedSessionId);
  const isLiveOrSuspended =
    match.state === 'IN_PROGRESS' || isSuspendedAnnotation || Boolean(match.suspendedSessionId);
  const isFinished = match.state === 'FINISHED';

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

  const showServer = !isFinished && Boolean(currentServer);
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
    barBg: isSuspendedAnnotation ? '#92400e' : courtColors.bar,
    scoreBg: isSuspendedAnnotation ? '#78350f' : courtColors.score,
    setsWonP1: scoreState?.setsWon?.player1 ?? 0,
    setsWonP2: scoreState?.setsWon?.player2 ?? 0,
  };
}
