'use client';

import { MatchStatusBadge, MatchActions, FormatLabel } from './match-card-components';
import { HeaderButton } from './match-card-header-button';
import { MatchCardAnnotateButton } from './match-card-annotate-button';
import type { DashboardMatchPayload } from './match-card-types';

interface MatchCardHeaderProps {
  match: DashboardMatchPayload;
  isCreator?: boolean;
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
  isCreator = true,
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
  // Cartaz não expõe controles diretos (iniciar/retomar/placar/excluir):
  // `state-route-guards` bloqueia escrita em `isTemplate` e a única ação
  // válida é criar a própria anotação a partir dele.
  const isCartaz = Boolean(match.isTemplate || match.isPublicTemplate);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3 pb-2">
      <div className="flex flex-wrap items-center gap-2">
        {isCartaz ? (
          <span
            data-testid={`match-template-badge-${match.id}`}
            className="rounded-full border border-telemetry-volt/40 bg-telemetry-volt/15 px-2 py-0.5 text-xs font-bold text-telemetry-volt"
          >
            Cartaz
          </span>
        ) : (
          <MatchStatusBadge isSuspended={isSuspended} state={match.state} />
        )}
        <FormatLabel format={match.format} matchType={match.matchType} courtType={match.courtType ?? undefined} />
        {!isCartaz && isLiveOrSuspended && (
          <div className="flex items-center gap-1 sm:gap-1.5">
            {onEditScore && (
              <HeaderButton id="edit-score" match={match} onClick={onEditScore}
                title="Editar placar" iconSrc="/icons/editar_placar.webp"
                emoji="✏️" label="Editar Placar" mobileLabel="Placar" />
            )}
            {onResumeMatch && (
              <HeaderButton id="resume" match={match} onClick={onResumeMatch}
                title="Retomar partida" iconSrc="/icons/retomar_partida.webp"
                emoji="▶" label="Retomar Partida" mobileLabel="Retomar" variant="blue" />
            )}
            {onSetSummary && (
              <HeaderButton id="set-summary" match={match} onClick={onSetSummary}
                title="Análise do set" iconSrc="/icons/analise_set.webp"
                emoji="📊" label="Análise do Set" mobileLabel="Análise" />
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 ml-auto shrink-0 justify-end">
        {isCartaz ? (
          <MatchCardAnnotateButton match={match} />
        ) : (
          <>
            {!isFinished && isCreator && onEditInfo && (
              <HeaderButton id="edit-info" match={match} onClick={onEditInfo}
                title="Editar Informações da Partida" ariaLabel="Editar Informações"
                iconSrc="/icons/info_partida.webp" emoji="⚙️" label="Info" />
            )}
            <MatchActions match={match} onReport={onReport} onFinish={onFinish} onDelete={onDelete} onShare={onShare} />
          </>
        )}
      </div>
    </div>
  );
}
