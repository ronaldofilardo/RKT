'use client';

import { MatchStatusBadge, MatchActions, FormatLabel } from './match-card-components';
import type { DashboardMatchPayload } from './match-card-types';

const BTN_BASE = 'px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1';
const VARIANT = {
  elevated: 'bg-telemetry-elevated hover:bg-telemetry-active border border-telemetry-border/15 text-telemetry-text-primary shadow-sm',
  blue: 'bg-telemetry-blue hover:bg-telemetry-blue-light text-white shadow-sm',
} as const;

interface HeaderButtonProps {
  id: string;
  match: DashboardMatchPayload;
  onClick: (match: DashboardMatchPayload) => void;
  title: string;
  ariaLabel?: string;
  emoji: string;
  label: string;
  mobileLabel?: string;
  variant?: keyof typeof VARIANT;
}

function HeaderButton({ id, match, onClick, title, ariaLabel, emoji, label, mobileLabel, variant = 'elevated' }: HeaderButtonProps) {
  return (
    <button
      type="button"
      data-testid={`match-card-${id}-${match.id}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick(match);
      }}
      className={`${BTN_BASE} ${VARIANT[variant]}`}
      title={title}
      aria-label={ariaLabel ?? title}
    >
      <span aria-hidden="true">{emoji}</span>
      <span className="hidden sm:inline">{label}</span>
      {mobileLabel && <span className="sm:hidden">{mobileLabel}</span>}
    </button>
  );
}

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
        <MatchActions match={match} onReport={onReport} onFinish={onFinish} onDelete={onDelete} />
        <FormatLabel format={match.format} matchType={match.matchType} />
      </div>
    </div>
  );
}
