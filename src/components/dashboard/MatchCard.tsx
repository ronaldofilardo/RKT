"use client";

import { useMemo, useCallback } from "react";
import { normalizeScoreState, isMatchTiebreakFormat, type TennisFormat, getSinglePointDisplay } from "./match-card-utils";
import { MatchStatusBadge, MatchActions, FormatLabel, ScoreDisplay } from "./match-card-components";

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

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm p-4 transition-shadow ${onClick ? "cursor-pointer hover:shadow-md" : ""}`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-3">
        <MatchStatusBadge isSuspended={isSuspendedAnnotation} state={match.state} />
        <div className="flex items-center gap-2">
          <MatchActions match={match} onReport={onReport} onFinish={onFinish} onDelete={onDelete} />
          <FormatLabel format={match.format} />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-x-4">
        {hasScore ? (
          <>
            <div className="grid grid-rows-[1.5rem_2rem_2rem] text-sm">
              <div className="text-[10px] text-gray-500 font-mono"></div>
              <p className="font-semibold text-gray-900 truncate self-center">
                {match.player1.name}
              </p>
              <p className="font-semibold text-gray-900 truncate self-center">
                {match.player2.name}
              </p>
            </div>
            <div className="text-right text-sm font-mono">
              {scoreState?.sets && scoreState.sets.length > 0 ? (
                <div className="grid" style={{
                  gridTemplateColumns: `repeat(${scoreState.sets.length}, 1.5rem) 2.5rem`,
                  gridTemplateRows: '1.5rem 2rem 2rem',
                  rowGap: '0.125rem',
                }}>
                  <span className="text-[10px] text-gray-500 text-center" style={{ gridColumn: `1 / ${scoreState.sets.length + 1}` }}>
                    Sets
                  </span>
                  <span></span>
                  {scoreState.sets.map((_: any, idx: number) => (
                    <span key={idx} className="text-[10px] text-gray-500 text-center">
                      {idx + 1}
                    </span>
                  ))}
                  <span className="text-[10px] text-gray-500 text-center">Pontos</span>
                  {scoreState.sets.map((s: any, idx: number) => {
                    let displayScore = s.player1 ?? 0;
                    if (s.isTiebreak && s.tiebreakScore) {
                      displayScore = s.tiebreakScore.player1;
                    } else if (isMatchTiebreak && idx === 0) {
                      displayScore = s.player1 ?? 0;
                    }
                    return (
                      <span key={idx} className={`text-sm flex items-center justify-center ${isSuspendedAnnotation ? 'text-amber-700' : 'text-gray-900'}`}>
                        {displayScore}
                      </span>
                    );
                  })}
                  <span className={`text-sm flex items-center justify-center ${isSuspendedAnnotation ? 'text-amber-700' : 'text-gray-900'}`}>
                    {isMatchTiebreak && scoreState.sets.length > 0
                      ? '-'
                      : getSinglePointDisplay(scoreState?.currentGame, 'player1')}
                  </span>
                  {scoreState.sets.map((s: any, idx: number) => {
                    let displayScore = s.player2 ?? 0;
                    if (s.isTiebreak && s.tiebreakScore) {
                      displayScore = s.tiebreakScore.player2;
                    } else if (isMatchTiebreak && idx === 0) {
                      displayScore = s.player2 ?? 0;
                    }
                    return (
                      <span key={idx} className={`text-sm flex items-center justify-center ${isSuspendedAnnotation ? 'text-amber-700' : 'text-gray-900'}`}>
                        {displayScore}
                      </span>
                    );
                  })}
                  <span className={`text-sm flex items-center justify-center ${isSuspendedAnnotation ? 'text-amber-700' : 'text-gray-900'}`}>
                    {isMatchTiebreak && scoreState.sets.length > 0
                      ? '-'
                      : getSinglePointDisplay(scoreState?.currentGame, 'player2')}
                  </span>
                </div>
              ) : scoreState?.currentGame ? (
                <div className="grid grid-cols-1 gap-y-1" style={{ gridTemplateRows: '1.5rem 2rem 2rem' }}>
                  <span className="text-[10px] text-gray-500 text-center">Pontos</span>
                  <span className={`text-sm flex items-center justify-end ${isSuspendedAnnotation ? 'text-amber-700' : 'text-gray-900'}`}>
                    {getSinglePointDisplay(scoreState.currentGame, 'player1')}
                  </span>
                  <span className={`text-sm flex items-center justify-end ${isSuspendedAnnotation ? 'text-amber-700' : 'text-gray-900'}`}>
                    {getSinglePointDisplay(scoreState.currentGame, 'player2')}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-[1.5rem_2.5rem] gap-x-1 text-[10px] text-gray-500">
                  <span className="text-center">Pontos</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-sm">
            <p className="font-semibold text-gray-900 truncate">{match.player1.name}</p>
            <p className="font-semibold text-gray-900 truncate">{match.player2.name}</p>
          </div>
        )}
      </div>

      {match.scheduledAt && (
        <p className="mt-3 text-xs text-gray-500">
          {new Date(match.scheduledAt).toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  );
}