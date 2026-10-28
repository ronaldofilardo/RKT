"use client";

import { useCallback } from "react";
import { getColumnTitles, getMaxSetsForFormat } from "@/components/scoring/scoreboard-card-logic";
import { renderSetScore } from "@/components/scoring/scoreboard-card-cells";
import { abbreviateDoublesName } from "@/components/scoring/doubles-name-abbreviation.logic";
import { MatchCardHeader } from "./match-card-header";
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

  const format = match.format as string;
  const columnTitles = getColumnTitles(format as any, d.displayedSets.length, getMaxSetsForFormat(format as any));

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
      />

      <div className="px-4 pb-3">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="text-[10px] font-space-grotesk">
              <th scope="col" aria-label="Jogador" className="text-left py-0.5 px-2 w-[110px] sm:w-[120px] bg-telemetry-elevated border-b border-white/10"></th>
              <th scope="col" aria-label="Vencedor" className="w-5 sm:w-6 bg-telemetry-elevated border-l border-b border-white/10"></th>
              {columnTitles.map((title, i) => (
                <th
                  key={i}
                  scope="col"
                  aria-label={title}
                  className={`text-center px-1 py-0.5 w-8 sm:w-12 bg-telemetry-elevated border-l border-b border-white/10 ${d.isLiveOrSuspended && i === 0 ? 'font-bold text-telemetry-volt' : 'text-telemetry-text-muted'}`}
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="text-xs">
              <td
                title={p1Name}
                className={`text-left py-1 px-2 font-bold tracking-wide truncate max-w-full border-b border-white/10 bg-telemetry-card text-telemetry-text-primary`}
              >
                {p1Name}
              </td>
              <td className={`text-center py-1 bg-telemetry-card border-l border-b border-white/10 text-xs`}>
                {d.isServerP1 ? <span title="Sacador" aria-label="Sacador" role="img" className="text-xs select-none">🎾</span> : null}
              </td>
              {d.displayedSets.map((set, i) => {
                const style = i === 0 && d.isLiveOrSuspended
                  ? 'text-telemetry-volt font-bold bg-telemetry-elevated'
                  : 'text-telemetry-text-muted bg-telemetry-card';
                return (
                  <td
                    key={i}
                    className={`text-center px-1 py-1 text-sm font-space-grotesk font-semibold border-l border-b border-white/10 ${style}`}
                  >
                    {renderSetScore(set as { player1: number; player2: number; isTiebreak?: boolean; tiebreakScore?: { player1: number; player2: number } | null } | undefined, 'player1')}
                  </td>
                );
              })}
            </tr>
            <tr className="text-xs">
              <td
                title={p2Name}
                className={`text-left py-1 px-2 font-bold tracking-wide truncate max-w-full border-b border-white/10 bg-telemetry-card text-telemetry-text-primary`}
              >
                {p2Name}
              </td>
              <td className={`text-center py-1 bg-telemetry-card border-l border-white/10 text-xs`}>
                {d.isServerP2 ? <span title="Sacador" aria-label="Sacador" role="img" className="text-xs select-none">🎾</span> : null}
              </td>
              {d.displayedSets.map((set, i) => {
                const style = i === 0 && d.isLiveOrSuspended
                  ? 'text-telemetry-volt font-bold bg-telemetry-elevated'
                  : 'text-telemetry-text-muted bg-telemetry-card';
                return (
                  <td
                    key={i}
                    className={`text-center px-1 py-1 text-sm font-space-grotesk font-semibold border-l border-b border-white/10 ${style}`}
                  >
                    {renderSetScore(set as { player1: number; player2: number; isTiebreak?: boolean; tiebreakScore?: { player1: number; player2: number } | null } | undefined, 'player2')}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

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
