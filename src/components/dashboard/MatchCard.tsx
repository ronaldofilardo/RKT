import { useMemo, useCallback } from 'react';
import { normalizeScoreState, isMatchTiebreakFormat, isCurrentSetMatchTiebreak, type TennisFormat } from './match-card-utils';
import { MatchStatusBadge, MatchActions, FormatLabel } from './match-card-components';
import { PlayerNames, ScoreDisplay } from './MatchCard.score-display';

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
    const normalized = normalizeScoreState(match.scoreState, match.format as TennisFormat);
    return normalized ?? normalizeScoreState(match.matchStateSnapshot, match.format as TennisFormat);
  }, [match.scoreState, match.matchStateSnapshot, match.format]);
  const suspendedAnnotationScore = useMemo(() => parseSnapshot(match.matchStateSnapshot), [match.matchStateSnapshot]);
  const handleClick = useCallback(() => onClick?.(match), [onClick, match]);
  const hasScore = scoreState != null || suspendedAnnotationScore != null;
  const isMatchTiebreak = isMatchTiebreakFormat(match.format);
  const isCurrentSetMT = scoreState?.sets?.length ? isCurrentSetMatchTiebreak(scoreState.sets, match.format as TennisFormat) : false;
  const isFinished = match.state === 'FINISHED';

  return <div className={`bg-white rounded-xl border shadow-sm p-4 transition-shadow ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} aria-label={onClick ? `Abrir partida ${match.player1.name} vs ${match.player2.name}` : undefined} onClick={handleClick} onKeyDown={(event) => handleKeyboard(event, onClick, handleClick)}>
    <div className="flex items-center justify-between mb-3"><MatchStatusBadge isSuspended={isSuspendedAnnotation} state={match.state} /><div className="flex items-center gap-2"><MatchActions match={match} onReport={onReport} onFinish={onFinish} onDelete={onDelete} /><FormatLabel format={match.format} /></div></div>
    <div className="grid grid-cols-[1fr_auto] gap-x-4"><PlayerNames match={match} hasScore={hasScore} />{hasScore && <div className="text-right text-sm font-mono"><ScoreDisplay scoreState={scoreState} isFinished={isFinished} isMatchTiebreak={isMatchTiebreak} isCurrentSetMT={isCurrentSetMT} suspended={isSuspendedAnnotation} /></div>}</div>
    {match.scheduledAt && <p className="mt-3 text-xs text-gray-500">{new Date(match.scheduledAt).toLocaleString('pt-BR')}</p>}
  </div>;
}

function parseSnapshot(snapshot?: string | null) {
  if (!snapshot) return null;
  try {
    const raw = JSON.parse(snapshot);
    return raw?.state && Array.isArray(raw?.history) ? raw.state : raw;
  } catch {
    return null;
  }
}

function handleKeyboard(event: React.KeyboardEvent, onClick: MatchCardProps['onClick'], handleClick: () => void) {
  if (onClick && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    handleClick();
  }
}
