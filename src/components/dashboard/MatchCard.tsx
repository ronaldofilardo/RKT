"use client";

import { useMemo, useCallback } from "react";
import { normalizeScoreState, isMatchTiebreakFormat, isCurrentSetMatchTiebreak, type TennisFormat, type NormalizedScoreState, type SetCellScore } from "./match-card-utils";
import { MatchCardHeader } from "./match-card-header";
import { MatchCardScore } from "./match-card-score";
import type { MatchCardProps } from "./match-card-types";

// Re-export de compatibilidade (tipo movido para ./match-card-types).
export type { DashboardMatchPayload, MatchCardProps } from "./match-card-types";

const COURT_COLORS: Record<string, { bar: string; score: string }> = {
  CLAY:  { bar: '#b5543a', score: '#4a2a1a' },
  GRASS: { bar: '#2d8a3e', score: '#1a4a2a' },
  HARD:  { bar: '#1e4d7b', score: '#1a2a4a' },
};
const DEFAULT_COURT_COLOR = { bar: '#1e4d7b', score: '#1a2a4a' };

export function MatchCard({
  match,
  onClick,
  onReport,
  onFinish,
  onDelete,
  onEditScore,
  onResumeMatch,
  onSetSummary,
  onEditInfo,
}: MatchCardProps) {
  const isSuspendedAnnotation = Boolean(match.suspendedSessionId);
  const isLiveOrSuspended =
    match.state === 'IN_PROGRESS' || isSuspendedAnnotation || Boolean(match.suspendedSessionId);

  const scoreState = useMemo<NormalizedScoreState | null>(() => {
    if (match.scoreSummary) return match.scoreSummary as NormalizedScoreState;
    const normalizedFromScoreState = normalizeScoreState(match.scoreState, match.format as TennisFormat);
    if (normalizedFromScoreState) return normalizedFromScoreState;
    return normalizeScoreState(match.matchStateSnapshot, match.format as TennisFormat);
  }, [match.scoreSummary, match.scoreState, match.matchStateSnapshot, match.format]);

  const suspendedAnnotationScore = useMemo(() => {
    if (!match.matchStateSnapshot) return null;
    try {
      const raw = JSON.parse(match.matchStateSnapshot);
      const snap = raw?.state && Array.isArray(raw?.history) ? raw.state : raw;
      return snap;
    } catch {
      return null;
    }
  }, [match.matchStateSnapshot]);

  const isFinished = match.state === 'FINISHED';

  // No formato SHORT_SET_2V2_NO_AD, uma partida começa os dois sets em 2x2.
  // Enquanto a partida não estiver finalizada e houver apenas 1 set registrado,
  // projetamos visualmente o segundo set começando em 2x2.
  const displayedSets = useMemo<SetCellScore[]>(() => {
    const rawSets = scoreState?.sets || [];
    if (match.format === 'SHORT_SET_2V2_NO_AD' && !isFinished) {
      if (rawSets.length === 0) {
        return [
          { player1: 2, player2: 2, isTiebreak: false, tiebreakScore: null },
          { player1: 2, player2: 2, isTiebreak: false, tiebreakScore: null },
        ];
      }
      if (rawSets.length === 1) {
        return [
          rawSets[0],
          { player1: 2, player2: 2, isTiebreak: false, tiebreakScore: null },
        ];
      }
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
  const isServerP1 = showServer && currentServer === 'player1';
  const isServerP2 = showServer && currentServer === 'player2';

  const handleClick = useCallback(() => {
    if (onClick) onClick(match);
  }, [onClick, match]);

  const hasScore = scoreState != null || suspendedAnnotationScore != null;
  const isMatchTiebreak = isMatchTiebreakFormat(match.format);
  const isCurrentSetMT = isMatchTiebreak && displayedSets && displayedSets.length > 0
    ? isCurrentSetMatchTiebreak(displayedSets, match.format as TennisFormat)
    : false;
  const lastSet = displayedSets && displayedSets.length > 0 ? displayedSets[displayedSets.length - 1] : null;
  const lastSetTiebreakScore = !isCurrentSetMT && lastSet?.isTiebreak && lastSet?.tiebreakScore ? lastSet.tiebreakScore : null;

  const courtColors = COURT_COLORS[match.courtType ?? ''] ?? DEFAULT_COURT_COLOR;
  const barBg = isSuspendedAnnotation ? '#92400e' : courtColors.bar;
  const scoreBg = isSuspendedAnnotation ? '#78350f' : courtColors.score;
  const setsWonP1 = scoreState?.setsWon?.player1 ?? 0;
  const setsWonP2 = scoreState?.setsWon?.player2 ?? 0;

  return (
    <div
      data-testid={`match-card-${match.id}`}
      className={`rounded-xl border border-telemetry-border/10 shadow-sm transition-all bg-telemetry-card ${onClick ? "cursor-pointer hover:shadow-md hover:border-telemetry-border/20 hover:bg-telemetry-elevated" : ""}`}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <MatchCardHeader
        match={match}
        isSuspended={isSuspendedAnnotation}
        isFinished={isFinished}
        isLiveOrSuspended={isLiveOrSuspended}
        onReport={onReport}
        onFinish={onFinish}
        onDelete={onDelete}
        onEditScore={onEditScore}
        onResumeMatch={onResumeMatch}
        onSetSummary={onSetSummary}
        onEditInfo={onEditInfo}
      />

      <MatchCardScore
        playerName1={match.player1.name}
        playerName2={match.player2.name}
        isServerP1={isServerP1}
        isServerP2={isServerP2}
        barBg={barBg}
        scoreBg={scoreBg}
        setsWonP1={setsWonP1}
        setsWonP2={setsWonP2}
        hasScore={hasScore}
        isFinished={isFinished}
        format={match.format}
        displayedSets={displayedSets ?? []}
        currentGame={scoreState?.currentGame ?? null}
        isCurrentSetMT={isCurrentSetMT}
        lastSetTiebreakScore={lastSetTiebreakScore}
      />

      {match.scheduledAt && (
        <div className={`px-4 pb-3 flex items-center gap-1.5 text-xs font-medium ${match.state === 'SCHEDULED' ? 'text-purple-400' : 'text-telemetry-text-muted'}`}>
          <span aria-hidden="true" className={match.state === 'SCHEDULED' ? 'text-purple-400' : 'text-telemetry-text-primary/70'}>
            {match.state === 'SCHEDULED' ? '⏰' : '📅'}
          </span>
          <span>{new Date(match.scheduledAt).toLocaleString("pt-BR")}</span>
        </div>
      )}
    </div>
  );
}
