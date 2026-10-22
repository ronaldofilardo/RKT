"use client";

import { useCallback } from "react";
import { MatchCardHeader } from "./match-card-header";
import { MatchCardScore } from "./match-card-score";
import { useMatchCardData } from "./use-match-card-data";
import type { MatchCardProps } from "./match-card-types";

// Re-export de compatibilidade (tipo movido para ./match-card-types).
export type { DashboardMatchPayload, MatchCardProps } from "./match-card-types";

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
  const d = useMatchCardData(match);

  const onPrimaryClick = useCallback(() => {
    onClick?.(match);
  }, [onClick, match]);

  return (
    <div
      data-testid={`match-card-${match.id}`}
      className={`rounded-xl border border-telemetry-border/10 shadow-sm transition-all bg-telemetry-card ${onClick ? "cursor-pointer hover:shadow-md hover:border-telemetry-border/20 hover:bg-telemetry-elevated" : ""}`}
      onClick={onPrimaryClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onPrimaryClick();
        }
      }}
    >
      <MatchCardHeader
        match={match}
        isSuspended={d.isSuspendedAnnotation}
        isFinished={d.isFinished}
        isLiveOrSuspended={d.isLiveOrSuspended}
        onReport={onReport}
        onFinish={onFinish}
        onDelete={onDelete}
        onEditScore={onEditScore}
        onResumeMatch={onResumeMatch}
        onSetSummary={onSetSummary}
        onEditInfo={onEditInfo}
      />

      <MatchCardScore
        playerName1={
          match.matchType === 'DOUBLES' && match.player1Partner
            ? `${match.player1.name} / ${match.player1Partner.name}`
            : match.player1.name
        }
        playerName2={
          match.matchType === 'DOUBLES' && match.player2Partner
            ? `${match.player2.name} / ${match.player2Partner.name}`
            : match.player2.name
        }
        isServerP1={d.isServerP1}
        isServerP2={d.isServerP2}
        barBg={d.barBg}
        scoreBg={d.scoreBg}
        setsWonP1={d.setsWonP1}
        setsWonP2={d.setsWonP2}
        hasScore={d.hasScore}
        isFinished={d.isFinished}
        format={match.format}
        displayedSets={d.displayedSets}
        currentGame={d.scoreState?.currentGame ?? null}
        isCurrentSetMT={d.isCurrentSetMT}
        lastSetTiebreakScore={d.lastSetTiebreakScore}
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
