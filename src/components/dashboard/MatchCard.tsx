"use client";

import { useCallback } from "react";
import { findCurrentSetIndex, getMaxSetsForFormat } from "@/components/scoring/scoreboard-card-logic";
import { abbreviateDoublesName } from "@/components/scoring/doubles-name-abbreviation.logic";
import { MatchCardHeader } from "./match-card-header";
import { MatchCardScoreTable } from "./match-card-score-grid";
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
  onShare,
}: MatchCardProps) {
  const d = useMatchCardData(match);

  const format = match.format as string;
  const maxSets = getMaxSetsForFormat(format as any);
  const setCount = d.isLiveOrSuspended
    ? Math.max(d.paddedSets.length, maxSets)
    : Math.max(d.displayedSets.length, 1);
  // Apenas os títulos dos sets: a coluna "Pontos" (partida em andamento) é renderizada pela própria grade.
  const columnTitles = Array.from({ length: setCount }, (_, i) => `Set ${i + 1}`);
  const p1Name = abbreviateDoublesName(match.player1.name, match.player1Partner?.name ?? undefined);
  const p2Name = abbreviateDoublesName(match.player2.name, match.player2Partner?.name ?? undefined);

  const onPrimaryClick = useCallback(() => {
    onClick?.(match);
  }, [onClick, match]);

  const isSuspended = d.isSuspendedAnnotation;

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
        isSuspended={isSuspended}
        isFinished={d.isFinished}
        isLiveOrSuspended={d.isLiveOrSuspended}
        onReport={onReport}
        onFinish={onFinish}
        onDelete={onDelete}
        onEditScore={onEditScore}
        onResumeMatch={onResumeMatch}
        onSetSummary={onSetSummary}
        onEditInfo={onEditInfo}
        onShare={onShare}
      />

      <MatchCardScoreTable
        displayedSets={d.isLiveOrSuspended ? d.paddedSets : d.displayedSets}
        columnTitles={columnTitles}
        p1Name={p1Name}
        p2Name={p2Name}
        isServerP1={d.isServerP1}
        isServerP2={d.isServerP2}
        isLiveOrSuspended={d.isLiveOrSuspended}
        currentGame={d.currentGame}
        isCurrentSetMT={d.isCurrentSetMT}
        lastSetTiebreakScore={d.lastSetTiebreakScore}
        currentSetIndex={findCurrentSetIndex(d.displayedSets, format as any, { player1: d.setsWonP1, player2: d.setsWonP2 }, d.isFinished)}
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
