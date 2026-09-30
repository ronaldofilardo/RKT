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
    player1: { name: string; id?: string };
    player2: { name: string; id?: string };
    scheduledAt?: string | null;
    scoreState?: any;
    suspendedSessionId?: string;
    matchStateSnapshot?: string | null;
    initialServerId?: string | null;
    finishReason?: string | null;
    status?: string | null;
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

  const isFinished = match.state === 'FINISHED';

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

  const renderPlayerName = (name: string, isServer: boolean, testId: string) => (
    <span className="inline-flex items-center gap-2">
      <span className="text-white font-semibold">{name}</span>
      {isServer && (
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-black/75 border border-yellow-300 text-xs select-none shadow-md ring-1 ring-yellow-400/60"
          title="Sacador"
          aria-label="Sacador"
          role="img"
          data-testid={testId}
        >
          🎾
        </span>
      )}
    </span>
  );

  const handleClick = useCallback(() => {
    if (onClick) onClick(match);
  }, [onClick, match]);

  const hasScore = scoreState != null || suspendedAnnotationScore != null;
  const isMatchTiebreak = isMatchTiebreakFormat(match.format);
  const isCurrentSetMT = isMatchTiebreak && scoreState?.sets && scoreState.sets.length > 0
    ? isCurrentSetMatchTiebreak(scoreState.sets, match.format as TennisFormat)
    : false;
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
      data-testid={`match-card-${match.id}`}
      className={`rounded-xl border border-white/10 shadow-sm transition-all bg-telemetry-card ${onClick ? "cursor-pointer hover:shadow-md hover:border-white/20 hover:bg-[#151c2d]" : ""}`}
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
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <MatchStatusBadge isSuspended={isSuspendedAnnotation} state={match.state} />
        <div className="flex items-center gap-2">
          <MatchActions match={match} onReport={onReport} onFinish={onFinish} onDelete={onDelete} />
          <FormatLabel format={match.format} />
        </div>
      </div>

      {hasScore && scoreState?.sets && numSets > 0 ? (
        <div className="px-4 pb-3" style={{ display: 'table', width: '100%', borderCollapse: 'collapse' }}>
          {/* Player 1 row */}
          <div style={{ display: 'table-row' }}>
            <div
              className="flex items-center px-3 py-1.5 font-semibold text-white text-sm"
              style={{ backgroundColor: barBg, color: '#ffffff', display: 'table-cell', whiteSpace: 'nowrap' }}
            >
              {renderPlayerName(match.player1.name, isServerP1, "server-indicator-player1")}
            </div>
            <div style={{ display: 'table-cell', borderLeft: '2px solid #111827' }}>
              <div className="flex items-stretch">
                {scoreState.sets.map((s: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-center px-2 py-1.5 font-space-grotesk tabular-nums text-sm font-semibold text-white min-w-[2.5rem]"
                    style={{ backgroundColor: scoreBg, color: '#ffffff', borderRight: idx < numSets - 1 ? '1px solid #111827' : 'none' }}
                  >
                    {formatCompactSetScore(s, 'player1', isSetIndexMatchTiebreak(scoreState.sets, idx, match.format as TennisFormat))}
                  </div>
                ))}
                {!isFinished && (
                  <div
                    className="flex items-center justify-center px-2 py-1.5 font-space-grotesk tabular-nums text-sm font-semibold text-white min-w-[2.5rem]"
                    style={{ backgroundColor: scoreBg, color: '#ffffff' }}
                  >
                    {isCurrentSetMT
                      ? '-'
                      : lastSetTiebreakScore
                        ? lastSetTiebreakScore.player1
                        : getSinglePointDisplay(scoreState?.currentGame, 'player1')}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-center px-3 py-1.5 font-space-grotesk tabular-nums text-lg font-bold text-white min-w-[2rem]" style={{ backgroundColor: barBg, color: '#ffffff', display: 'table-cell' }}>
              {setsWonP1}
            </div>
          </div>

          {/* White separator line */}
          <div style={{ display: 'table-row' }}>
            <div className="h-[2px] bg-telemetry-elevated" style={{ display: 'table-cell', height: '2px', width: '100%' }} />
          </div>

          {/* Player 2 row */}
          <div style={{ display: 'table-row' }}>
            <div
              className="flex items-center px-3 py-1.5 font-semibold text-white text-sm"
              style={{ backgroundColor: barBg, color: '#ffffff', display: 'table-cell', whiteSpace: 'nowrap' }}
            >
              {renderPlayerName(match.player2.name, isServerP2, "server-indicator-player2")}
            </div>
            <div style={{ display: 'table-cell', borderLeft: '2px solid #111827' }}>
              <div className="flex items-stretch">
                {scoreState.sets.map((s: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-center px-2 py-1.5 font-space-grotesk tabular-nums text-sm font-semibold text-white min-w-[2.5rem]"
                    style={{ backgroundColor: scoreBg, color: '#ffffff', borderRight: idx < numSets - 1 ? '1px solid #111827' : 'none' }}
                  >
                    {formatCompactSetScore(s, 'player2', isSetIndexMatchTiebreak(scoreState.sets, idx, match.format as TennisFormat))}
                  </div>
                ))}
                {!isFinished && (
                  <div
                    className="flex items-center justify-center px-2 py-1.5 font-space-grotesk tabular-nums text-sm font-semibold text-white min-w-[2.5rem]"
                    style={{ backgroundColor: scoreBg, color: '#ffffff' }}
                  >
                    {isCurrentSetMT
                      ? '-'
                      : lastSetTiebreakScore
                        ? lastSetTiebreakScore.player2
                        : getSinglePointDisplay(scoreState?.currentGame, 'player2')}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-center px-3 py-1.5 font-space-grotesk tabular-nums text-lg font-bold text-white min-w-[2rem]" style={{ backgroundColor: barBg, color: '#ffffff', display: 'table-cell' }}>
              {setsWonP2}
            </div>
          </div>
        </div>
      ) : hasScore && scoreState?.currentGame ? (
        <div className="px-4 pb-3" style={{ display: 'table', width: '100%', borderCollapse: 'collapse' }}>
          <div style={{ display: 'table-row' }}>
            <div
              className="flex items-center px-3 py-1.5 font-semibold text-white text-sm"
              style={{ backgroundColor: barBg, color: '#ffffff', display: 'table-cell', whiteSpace: 'nowrap' }}
            >
              {renderPlayerName(match.player1.name, isServerP1, "server-indicator-player1")}
            </div>
            <div className="flex items-center justify-center px-2 py-1.5 font-space-grotesk tabular-nums text-sm font-semibold text-white min-w-[2.5rem]" style={{ backgroundColor: scoreBg, color: '#ffffff', borderLeft: '2px solid #111827', display: 'table-cell' }}>
              {getSinglePointDisplay(scoreState.currentGame, 'player1')}
            </div>
            <div className="flex items-center justify-center px-3 py-1.5 font-space-grotesk tabular-nums text-lg font-bold text-white min-w-[2rem]" style={{ backgroundColor: barBg, color: '#ffffff', display: 'table-cell' }}>
              {setsWonP1}
            </div>
          </div>
          <div style={{ display: 'table-row' }}>
            <div className="h-[2px] bg-telemetry-elevated" style={{ display: 'table-cell', height: '2px', width: '100%' }} />
          </div>
          <div style={{ display: 'table-row' }}>
            <div
              className="flex items-center px-3 py-1.5 font-semibold text-white text-sm"
              style={{ backgroundColor: barBg, color: '#ffffff', display: 'table-cell', whiteSpace: 'nowrap' }}
            >
              {renderPlayerName(match.player2.name, isServerP2, "server-indicator-player2")}
            </div>
            <div className="flex items-center justify-center px-2 py-1.5 font-space-grotesk tabular-nums text-sm font-semibold text-white min-w-[2.5rem]" style={{ backgroundColor: scoreBg, color: '#ffffff', borderLeft: '2px solid #111827', display: 'table-cell' }}>
              {getSinglePointDisplay(scoreState.currentGame, 'player2')}
            </div>
            <div className="flex items-center justify-center px-3 py-1.5 font-space-grotesk tabular-nums text-lg font-bold text-white min-w-[2rem]" style={{ backgroundColor: barBg, color: '#ffffff', display: 'table-cell' }}>
              {setsWonP2}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-3" style={{ display: 'table', width: '100%', borderCollapse: 'collapse' }}>
          <div style={{ display: 'table-row' }}>
            <div
              className="flex items-center px-3 py-1.5 font-semibold text-white text-sm"
              style={{ backgroundColor: barBg, color: '#ffffff', display: 'table-cell', whiteSpace: 'nowrap' }}
            >
              {renderPlayerName(match.player1.name, isServerP1, "server-indicator-player1")}
            </div>
          </div>
          <div style={{ display: 'table-row' }}>
            <div className="h-[2px] bg-telemetry-elevated" style={{ display: 'table-cell' }} />
          </div>
          <div style={{ display: 'table-row' }}>
            <div
              className="flex items-center px-3 py-1.5 font-semibold text-white text-sm"
              style={{ backgroundColor: barBg, color: '#ffffff', display: 'table-cell', whiteSpace: 'nowrap' }}
            >
              {renderPlayerName(match.player2.name, isServerP2, "server-indicator-player2")}
            </div>
          </div>
        </div>
      )}

      {match.scheduledAt && (
        <p className="px-4 pb-3 text-xs text-slate-300 font-medium">
          {new Date(match.scheduledAt).toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  );
}
