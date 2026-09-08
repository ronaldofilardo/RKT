"use client";

import { useMemo, useCallback } from "react";
import { normalizeScoreState, isMatchTiebreakFormat, isCurrentSetMatchTiebreak, isSetIndexMatchTiebreak, type TennisFormat, getSinglePointDisplay, formatCompactSetScore } from "./match-card-utils";
import { MatchStatusBadge, MatchActions, FormatLabel } from "./match-card-components";

const COURT_COLORS: Record<string, { bar: string; score: string }> = {
  CLAY:  { bar: '#b5543a', score: '#4a2a1a' },
  GRASS: { bar: '#2d8a3e', score: '#1a4a2a' },
  HARD:  { bar: '#1e4d7b', score: '#1a2a4a' },
};
const DEFAULT_COURT_COLOR = { bar: '#1e4d7b', score: '#1a2a4a' };

interface MatchCardProps {
  match: {
    id: string;
    state: string;
    format: string;
    courtType?: string | null;
    player1: { name: string };
    player2: { name: string };
    scheduledAt?: string | null;
    scoreState?: any;
    suspendedSessionId?: string;
    matchStateSnapshot?: string | null;
  };
  onClick?: (match: any) => void;
  onReport?: (match: any) => void;
  onFinish?: (match: any) => void;
  onDelete?: (match: any) => void;
}

export function MatchCard({ match, onClick, onReport, onFinish, onDelete }: MatchCardProps) {
  const isSuspendedAnnotation = Boolean(match.suspendedSessionId);

  const scoreState = useMemo(() => {
    const normalizedFromScoreState = normalizeScoreState(match.scoreState, match.format as TennisFormat);
    if (normalizedFromScoreState) return normalizedFromScoreState;
    return normalizeScoreState(match.matchStateSnapshot, match.format as TennisFormat);
  }, [match.scoreState, match.matchStateSnapshot, match.format]);

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

  const handleClick = useCallback(() => {
    if (onClick) onClick(match);
  }, [onClick, match]);

  const hasScore = scoreState != null || suspendedAnnotationScore != null;
  const isMatchTiebreak = isMatchTiebreakFormat(match.format);
  const isCurrentSetMT = isMatchTiebreak && scoreState?.sets && scoreState.sets.length > 0
    ? isCurrentSetMatchTiebreak(scoreState.sets, match.format as TennisFormat)
    : false;
  const isFinished = match.state === 'FINISHED';
  const lastSet = scoreState?.sets && scoreState.sets.length > 0 ? scoreState.sets[scoreState.sets.length - 1] : null;
  const lastSetTiebreakScore = !isCurrentSetMT && lastSet?.isTiebreak && lastSet?.tiebreakScore ? lastSet.tiebreakScore : null;

  const numSets = scoreState?.sets?.length ?? 0;
  const courtColors = COURT_COLORS[match.courtType ?? ''] ?? DEFAULT_COURT_COLOR;
  const barBg = isSuspendedAnnotation ? '#92400e' : courtColors.bar;
  const scoreBg = isSuspendedAnnotation ? '#78350f' : courtColors.score;
  const setsWonP1 = scoreState?.setsWon?.player1 ?? 0;
  const setsWonP2 = scoreState?.setsWon?.player2 ?? 0;

  return (
    <div
      className={`rounded-xl border border-white/10 shadow-sm transition-shadow ${onClick ? "cursor-pointer hover:shadow-md" : ""}`}
      style={{ backgroundColor: '#1a1a2e' }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Abrir partida ${match.player1.name} vs ${match.player2.name}` : undefined}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <MatchStatusBadge isSuspended={isSuspendedAnnotation} state={match.state} />
        <div className="flex items-center gap-2">
          <MatchActions match={match} onReport={onReport} onFinish={onFinish} onDelete={onDelete} />
          <FormatLabel format={match.format} />
        </div>
      </div>

      {hasScore && scoreState?.sets && numSets > 0 ? (
        <div className="px-4 pb-3">
          {/* Player 1 row */}
          <div className="flex items-stretch" style={{ borderRadius: '6px 6px 0 0', overflow: 'hidden' }}>
            <div
              className="flex items-center px-3 py-1.5 min-w-[7rem] max-w-[7rem] truncate font-semibold text-white text-sm"
              style={{ backgroundColor: barBg }}
            >
              {match.player1.name}
            </div>
            <div className="flex items-stretch" style={{ borderLeft: '2px solid #1a1a2e' }}>
              {scoreState.sets.map((s: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-center px-2 py-1.5 font-mono text-sm text-white min-w-[2.5rem]"
                  style={{ backgroundColor: scoreBg, borderRight: idx < numSets - 1 ? '1px solid #1a1a2e' : 'none' }}
                >
                  {formatCompactSetScore(s, 'player1', isSetIndexMatchTiebreak(scoreState.sets, idx, match.format as TennisFormat))}
                </div>
              ))}
              {!isFinished && (
                <div
                  className="flex items-center justify-center px-2 py-1.5 font-mono text-sm text-white min-w-[2.5rem]"
                  style={{ backgroundColor: scoreBg }}
                >
                  {isCurrentSetMT
                    ? '-'
                    : lastSetTiebreakScore
                      ? lastSetTiebreakScore.player1
                      : getSinglePointDisplay(scoreState?.currentGame, 'player1')}
                </div>
              )}
            </div>
            <div className="flex items-center justify-center px-3 py-1.5 font-mono text-lg font-bold text-white min-w-[2rem]" style={{ backgroundColor: barBg }}>
              {setsWonP1}
            </div>
          </div>

          {/* White separator line */}
          <div className="h-[2px] bg-white" />

          {/* Player 2 row */}
          <div className="flex items-stretch" style={{ borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
            <div
              className="flex items-center px-3 py-1.5 min-w-[7rem] max-w-[7rem] truncate font-semibold text-white text-sm"
              style={{ backgroundColor: barBg }}
            >
              {match.player2.name}
            </div>
            <div className="flex items-stretch" style={{ borderLeft: '2px solid #1a1a2e' }}>
              {scoreState.sets.map((s: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-center px-2 py-1.5 font-mono text-sm text-white min-w-[2.5rem]"
                  style={{ backgroundColor: scoreBg, borderRight: idx < numSets - 1 ? '1px solid #1a1a2e' : 'none' }}
                >
                  {formatCompactSetScore(s, 'player2', isSetIndexMatchTiebreak(scoreState.sets, idx, match.format as TennisFormat))}
                </div>
              ))}
              {!isFinished && (
                <div
                  className="flex items-center justify-center px-2 py-1.5 font-mono text-sm text-white min-w-[2.5rem]"
                  style={{ backgroundColor: scoreBg }}
                >
                  {isCurrentSetMT
                    ? '-'
                    : lastSetTiebreakScore
                      ? lastSetTiebreakScore.player2
                      : getSinglePointDisplay(scoreState?.currentGame, 'player2')}
                </div>
              )}
            </div>
            <div className="flex items-center justify-center px-3 py-1.5 font-mono text-lg font-bold text-white min-w-[2rem]" style={{ backgroundColor: barBg }}>
              {setsWonP2}
            </div>
          </div>
        </div>
      ) : hasScore && scoreState?.currentGame ? (
        <div className="px-4 pb-3">
          <div className="flex items-stretch" style={{ borderRadius: '6px 6px 0 0', overflow: 'hidden' }}>
            <div
              className="flex items-center px-3 py-1.5 min-w-[7rem] max-w-[7rem] truncate font-semibold text-white text-sm"
              style={{ backgroundColor: barBg }}
            >
              {match.player1.name}
            </div>
            <div className="flex items-center justify-center px-2 py-1.5 font-mono text-sm text-white min-w-[2.5rem]" style={{ backgroundColor: scoreBg, borderLeft: '2px solid #1a1a2e' }}>
              {getSinglePointDisplay(scoreState.currentGame, 'player1')}
            </div>
            <div className="flex items-center justify-center px-3 py-1.5 font-mono text-lg font-bold text-white min-w-[2rem]" style={{ backgroundColor: barBg }}>
              {setsWonP1}
            </div>
          </div>
          <div className="h-[2px] bg-white" />
          <div className="flex items-stretch" style={{ borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
            <div
              className="flex items-center px-3 py-1.5 min-w-[7rem] max-w-[7rem] truncate font-semibold text-white text-sm"
              style={{ backgroundColor: barBg }}
            >
              {match.player2.name}
            </div>
            <div className="flex items-center justify-center px-2 py-1.5 font-mono text-sm text-white min-w-[2.5rem]" style={{ backgroundColor: scoreBg, borderLeft: '2px solid #1a1a2e' }}>
              {getSinglePointDisplay(scoreState.currentGame, 'player2')}
            </div>
            <div className="flex items-center justify-center px-3 py-1.5 font-mono text-lg font-bold text-white min-w-[2rem]" style={{ backgroundColor: barBg }}>
              {setsWonP2}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-3">
          <div className="flex items-stretch" style={{ borderRadius: '6px 6px 0 0', overflow: 'hidden' }}>
            <div
              className="flex items-center px-3 py-1.5 min-w-[7rem] max-w-[7rem] truncate font-semibold text-white text-sm"
              style={{ backgroundColor: barBg }}
            >
              {match.player1.name}
            </div>
          </div>
          <div className="h-[2px] bg-white" />
          <div className="flex items-stretch" style={{ borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
            <div
              className="flex items-center px-3 py-1.5 min-w-[7rem] max-w-[7rem] truncate font-semibold text-white text-sm"
              style={{ backgroundColor: barBg }}
            >
              {match.player2.name}
            </div>
          </div>
        </div>
      )}

      {match.scheduledAt && (
        <p className="px-4 pb-3 text-xs text-gray-500">
          {new Date(match.scheduledAt).toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  );
}
