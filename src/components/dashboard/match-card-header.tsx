'use client';

import { MatchStatusBadge, MatchActions, FormatLabel } from './match-card-components';
import { HeaderButton } from './match-card-header-button';
import type { DashboardMatchPayload } from './match-card-types';

interface MatchCardHeaderProps {
  match: DashboardMatchPayload;
  isSuspended: boolean;
  isFinished: boolean;
  isLiveOrSuspended: boolean;
  onReport?: (match: DashboardMatchPayload) => void;
  onFinish?: (match: DashboardMatchPayload) => void;
  onDelete?: (match: DashboardMatchPayload) => void;
  onEditScore?: (match: DashboardMatchPayload) => void;
  onResumeMatch?: (match: DashboardMatchPayload) => void;
  onSetSummary?: (match: DashboardMatchPayload) => void;
  onEditInfo?: (match: DashboardMatchPayload) => void;
  onShare?: (match: DashboardMatchPayload) => void;
}

export function MatchCardHeader({
  match,
  isSuspended,
  isFinished,
  isLiveOrSuspended,
  onReport,
  onFinish,
  onDelete,
  onEditScore,
  onResumeMatch,
  onSetSummary,
  onEditInfo,
  onShare,
}: MatchCardHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3 pb-2">
      <div className="flex flex-wrap items-center gap-2">
        <MatchStatusBadge isSuspended={isSuspended} state={match.state} />
        {isLiveOrSuspended && (
          <div className="flex items-center gap-1 sm:gap-1.5">
            {onEditScore && (
              <HeaderButton id="edit-score" match={match} onClick={onEditScore} title="Editar placar" emoji="✏️" label="Editar Placar" mobileLabel="Placar" />
            )}
            {onResumeMatch && (
              <HeaderButton id="resume" match={match} onClick={onResumeMatch} title="Retomar partida" emoji="▶" label="Retomar Partida" mobileLabel="Retomar" variant="blue" />
            )}
            {onSetSummary && (
              <HeaderButton id="set-summary" match={match} onClick={onSetSummary} title="Análise do set" emoji="📊" label="Análise do Set" mobileLabel="Análise" />
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 ml-auto shrink-0 justify-end">
        {!isFinished && onEditInfo && (
          <HeaderButton id="edit-info" match={match} onClick={onEditInfo} title="Editar Informações da Partida" ariaLabel="Editar Informações" emoji="⚙️" label="Info" />
        )}
        <MatchActions match={match} onReport={onReport} onFinish={onFinish} onDelete={onDelete} onShare={onShare} />
        <FormatLabel format={match.format} matchType={match.matchType} />
      </div>
    </div>
  );
}
