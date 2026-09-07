"use client";

import { useMemo, useCallback } from "react";
import { normalizeScoreState, isMatchTiebreakFormat, isCurrentSetMatchTiebreak, type TennisFormat, getSinglePointDisplay, formatCompactSetScore } from "./match-card-utils";
import { MatchStatusBadge, MatchActions, FormatLabel } from "./match-card-components";

interface MatchCardProps {
  match: {
    id: string;
    state: string;
    format: string;
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
  const nameColor = isSuspendedAnnotation ? 'text-amber-400' : 'text-gray-100';
  const scoreColor = isSuspendedAnnotation ? 'text-amber-400' : 'text-gray-100';

  return (
    <div
      className={`bg-gray-800 rounded-xl border border-white/10 shadow-sm p-4 transition-shadow ${onClick ? "cursor-pointer hover:shadow-md" : ""}`}
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
      <div className="flex items-center justify-between mb-3">
        <MatchStatusBadge isSuspended={isSuspendedAnnotation} state={match.state} />
        <div className="flex items-center gap-2">
          <MatchActions match={match} onReport={onReport} onFinish={onFinish} onDelete={onDelete} />
          <FormatLabel format={match.format} />
        </div>
      </div>

      {hasScore ? (
        scoreState?.sets && numSets > 0 ? (
          <div className="font-mono text-sm" style={{
            display: 'grid',
            gridTemplateColumns: isFinished
              ? `5rem repeat(${numSets}, 3.5rem)`
              : `5rem repeat(${numSets}, 3.5rem) 2.5rem`,
            gridTemplateRows: '1.25rem 1.75rem 1.75rem',
            rowGap: '0.125rem',
          }}>
            <span className="text-[10px] text-gray-500"></span>
            {scoreState.sets.map((_: any, idx: number) => (
              <span key={idx} className="text-[10px] text-gray-500 text-right pr-1" style={{ gridColumn: idx + 2, gridRow: '1' }}>
                {idx + 1}
              </span>
            ))}
            {!isFinished && <span className="text-[10px] text-gray-500 text-right pr-1" style={{ gridColumn: numSets + 2, gridRow: '1' }}>Pontos</span>}

            <span className={`font-semibold truncate ${nameColor}`} style={{ gridColumn: '1', gridRow: '2' }}>
              {match.player1.name}
            </span>
            {scoreState.sets.map((s: any, idx: number) => (
              <span key={idx} className={`text-right pr-1 ${scoreColor}`} style={{ gridColumn: idx + 2, gridRow: '2' }}>
                {formatCompactSetScore(s, 'player1')}
              </span>
            ))}
            {!isFinished && (
              <span className={`text-right pr-1 ${scoreColor}`} style={{ gridColumn: numSets + 2, gridRow: '2' }}>
                {isCurrentSetMT
                  ? '-'
                  : lastSetTiebreakScore
                    ? lastSetTiebreakScore.player1
                    : getSinglePointDisplay(scoreState?.currentGame, 'player1')}
              </span>
            )}

            <span className={`font-semibold truncate ${nameColor}`} style={{ gridColumn: '1', gridRow: '3' }}>
              {match.player2.name}
            </span>
            {scoreState.sets.map((s: any, idx: number) => (
              <span key={idx} className={`text-right pr-1 ${scoreColor}`} style={{ gridColumn: idx + 2, gridRow: '3' }}>
                {formatCompactSetScore(s, 'player2')}
              </span>
            ))}
            {!isFinished && (
              <span className={`text-right pr-1 ${scoreColor}`} style={{ gridColumn: numSets + 2, gridRow: '3' }}>
                {isCurrentSetMT
                  ? '-'
                  : lastSetTiebreakScore
                    ? lastSetTiebreakScore.player2
                    : getSinglePointDisplay(scoreState?.currentGame, 'player2')}
              </span>
            )}
          </div>
        ) : scoreState?.currentGame ? (
          <div className="font-mono text-sm" style={{
            display: 'grid',
            gridTemplateColumns: '5rem 2.5rem',
            gridTemplateRows: '1rem 1.75rem 1.75rem',
            rowGap: '0.125rem',
          }}>
            <span></span>
            <span className="text-[10px] text-gray-500 text-center">Pontos</span>
            <span className={`font-semibold truncate ${nameColor}`}>{match.player1.name}</span>
            <span className={`text-center ${scoreColor}`}>{getSinglePointDisplay(scoreState.currentGame, 'player1')}</span>
            <span className={`font-semibold truncate ${nameColor}`}>{match.player2.name}</span>
            <span className={`text-center ${scoreColor}`}>{getSinglePointDisplay(scoreState.currentGame, 'player2')}</span>
          </div>
        ) : (
          <div className="text-sm">
            <p className={`font-semibold truncate ${nameColor}`}>{match.player1.name}</p>
            <p className={`font-semibold truncate ${nameColor}`}>{match.player2.name}</p>
          </div>
        )
      ) : (
        <div className="text-sm">
          <p className={`font-semibold truncate ${nameColor}`}>{match.player1.name}</p>
          <p className={`font-semibold truncate ${nameColor}`}>{match.player2.name}</p>
        </div>
      )}

      {match.scheduledAt && (
        <p className="mt-3 text-xs text-gray-500">
          {new Date(match.scheduledAt).toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  );
}
