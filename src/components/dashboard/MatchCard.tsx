"use client";

import { useCallback } from "react";
import { findCurrentSetIndex, getMaxSetsForFormat } from "@/components/scoring/scoreboard-card-logic";
import { abbreviateDoublesName } from "@/components/scoring/doubles-name-abbreviation.logic";
import { MatchCardHeader } from "./match-card-header";
import { MatchCardScoreTable } from "./match-card-score-grid";
import { useMatchCardData } from "./use-match-card-data";
import type { MatchCardProps, MatchPlayerPayload } from "./match-card-types";

// Re-export de compatibilidade (tipo movido para ./match-card-types).
export type { DashboardMatchPayload, MatchCardProps } from "./match-card-types";

function checkPlayerOwnClub(
  p1: MatchPlayerPayload,
  p1Partner?: MatchPlayerPayload | null,
  activeCtId?: string | null,
  activeCtName?: string | null,
  matchCtId?: string | null,
): boolean {
  if (!activeCtId || activeCtId === 'PARTICULAR') return false;

  const testPlayer = (p?: MatchPlayerPayload | null) => {
    if (!p) return false;
    if (p.playerCts?.some((pc) => pc.ctId === activeCtId)) return true;
    if (p.clubId && p.clubId === activeCtId) return true;
    if (p.club && (p.club === activeCtId || (activeCtName && p.club.trim().toLowerCase() === activeCtName.trim().toLowerCase()))) {
      return true;
    }
    if (matchCtId && matchCtId === activeCtId && (!p.club || (activeCtName && p.club.trim().toLowerCase() === activeCtName.trim().toLowerCase()))) {
      return true;
    }
    return false;
  };

  return testPlayer(p1) || testPlayer(p1Partner);
}

function checkPlayerOwnCoach(
  p1: MatchPlayerPayload,
  p1Partner?: MatchPlayerPayload | null,
  userId?: string | null,
  followedPlayerIds?: readonly string[] | string[] | null,
  activeCtId?: string | null,
): boolean {
  const isParticular = activeCtId === 'PARTICULAR' || !activeCtId;
  if (!isParticular) return false;

  const testPlayer = (p?: MatchPlayerPayload | null) => {
    if (!p) return false;
    if (userId && p.createdByUserId === userId) return true;
    if (p.id && followedPlayerIds && followedPlayerIds.includes(p.id)) return true;
    return false;
  };

  return testPlayer(p1) || testPlayer(p1Partner);
}

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
  ctId,
  ctName,
  userId,
  followedPlayerIds,
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
  const p1Club = match.player1.club ?? null;
  const p2Club = match.player2.club ?? null;
  const p1CreatedBy = match.player1.createdByName ?? null;
  const p2CreatedBy = match.player2.createdByName ?? null;

  const isP1OwnClub = checkPlayerOwnClub(match.player1, match.player1Partner, ctId, ctName, match.ctId);
  const isP2OwnClub = checkPlayerOwnClub(match.player2, match.player2Partner, ctId, ctName, match.ctId);

  const isP1OwnAthlete = checkPlayerOwnCoach(match.player1, match.player1Partner, userId, followedPlayerIds, ctId);
  const isP2OwnAthlete = checkPlayerOwnCoach(match.player2, match.player2Partner, userId, followedPlayerIds, ctId);

  const isWinnerP1 = d.isFinished && (
    Boolean(match.winnerId && (match.winnerId === match.player1.id || match.winnerId === match.player1Partner?.id)) ||
    d.setsWonP1 > d.setsWonP2 || (d.isCurrentSetMT && (d.displayedSets[0]?.player1 ?? 0) > (d.displayedSets[0]?.player2 ?? 0))
  );
  const isWinnerP2 = d.isFinished && (
    Boolean(match.winnerId && (match.winnerId === match.player2.id || match.winnerId === match.player2Partner?.id)) ||
    d.setsWonP2 > d.setsWonP1 || (d.isCurrentSetMT && (d.displayedSets[0]?.player2 ?? 0) > (d.displayedSets[0]?.player1 ?? 0))
  );

  const onPrimaryClick = useCallback(() => {
    onClick?.(match);
  }, [onClick, match]);

  const isSuspended = d.isSuspendedAnnotation;

  // Court type border accent e destaque para partida finalizada
  const courtType = match.courtType ?? 'HARD';
  const courtBorderClass = d.isFinished
    ? "border-l-4 border-emerald-600 dark:border-telemetry-volt dark:shadow-[0_0_12px_rgba(204,255,0,0.35)]"
    : `border-l-3 border-[rgb(var(--telemetry-court-${courtType.toLowerCase()}))]`;

  // Diferenciação visual marcante para partida finalizada (identificação rápida na listagem)
  const finishedCardClass = d.isFinished
    ? "bg-emerald-50/40 dark:bg-[#0c1424] border-emerald-500/40 dark:border-telemetry-volt/30 dark:ring-1 dark:ring-telemetry-volt/25 shadow-md"
    : "bg-telemetry-card border-telemetry-border/10";

  return (
    <div
      data-testid={`match-card-${match.id}`}
      className={`rounded-xl border shadow-sm transition-all ${finishedCardClass} ${onClick ? "cursor-pointer hover:shadow-md hover:border-telemetry-border/20 hover:bg-telemetry-elevated" : ""} ${courtBorderClass}`}
      onClick={onPrimaryClick}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? `Partida: ${p1Name} vs ${p2Name}` : undefined}
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
        p1Club={p1Club}
        p2Club={p2Club}
        p1CreatedBy={p1CreatedBy}
        p2CreatedBy={p2CreatedBy}
        isP1OwnClub={isP1OwnClub}
        isP2OwnClub={isP2OwnClub}
        isP1OwnAthlete={isP1OwnAthlete}
        isP2OwnAthlete={isP2OwnAthlete}
        isWinnerP1={isWinnerP1}
        isWinnerP2={isWinnerP2}
        isFinished={d.isFinished}
        ctId={ctId}
        isServerP1={d.isServerP1}
        isServerP2={d.isServerP2}
        isLiveOrSuspended={d.isLiveOrSuspended}
        currentGame={d.currentGame}
        isCurrentSetMT={d.isCurrentSetMT}
        lastSetTiebreakScore={d.lastSetTiebreakScore}
        currentSetIndex={findCurrentSetIndex(d.displayedSets, format as any, { player1: d.setsWonP1, player2: d.setsWonP2 }, d.isFinished)}
      />

      {d.isFinished ? (
        <div className="px-4 pb-2.5 pt-1.5 flex items-center justify-between text-xs font-medium text-telemetry-text-muted border-t border-telemetry-border/10 mt-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-telemetry-volt">
            <span aria-hidden="true" className="font-black text-sm">✓</span> Partida Finalizada
          </span>
          {match.scheduledAt && (
            <span className="text-xs text-telemetry-text-muted/70">
              📅 {new Date(match.scheduledAt).toLocaleString("pt-BR")}
            </span>
          )}
        </div>
      ) : match.scheduledAt && (
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
