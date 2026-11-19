"use client";

import React from "react";
import CourtBackground from "@/components/scoring/CourtBackground";
import { ScoringHeader } from "@/components/scoring/ScoringHeader";
import { ContextBadges } from "@/components/scoring/ContextBadges";
import { TacticalInsightBanner } from "@/components/scoring/TacticalInsightBanner";
import type { ScoringPlayAreaProps } from "./scoring-play-area.types";
import { PlayAreaPlayers } from "./scoring-play-area-players";
import { ScoringFinishedBanner } from "./scoring-finished-banner";
import { DecidingPointBanner } from "./scoring-deciding-point-banner";

export function ScoringPlayArea(props: ScoringPlayAreaProps) {
  const {
    match, effectiveScoreState, suspendedSession, liveCounters,
    tacticalInsights, completedSetsCount, p1IsServing, p2IsServing,
    activeServerId, activeReceiverId, isSetPoint, isBreakPoint, isMatchPoint,
    isTiebreak, isSuperTiebreak, winner, pointsHistory, scoreState, isFinished,
    serverControls, isServePanelOpen = false, annotationBars,
    awaitingWinnerSelection = false, onOpenSetSummary, onPoint, onSwipeUndo,
    onNavigateReport, onRegisterAndExit, onChangeServer, onSelectReceiverOverride,
    isDecidingPoint = false, canChangeServer = true,
  } = props;

  const receivingTeam = p1IsServing
    ? [match.player2, match.player2Partner].filter(Boolean)
    : [match.player1, match.player1Partner].filter(Boolean);

  return (
    <div
      data-serve-panel={isServePanelOpen ? 'open' : 'closed'}
      className="flex-1 min-h-0 flex flex-col gap-1 px-2 sm:px-3 py-1 sm:py-2 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <CourtBackground courtType={match.courtType} />
      </div>

      {/* Header de 3 colunas: Placar (esq), Formato/Torneio/Fase (centro), Stats (dir) */}
      <div className="my-0.5 sm:my-1 flex-shrink-0">
        <ScoringHeader
          match={match}
          effectiveScoreState={effectiveScoreState}
          isSuspended={!!suspendedSession}
          liveCounters={liveCounters}
          completedSetsCount={completedSetsCount}
          p1IsServing={p1IsServing}
          p2IsServing={p2IsServing}
          onOpenSetSummary={onOpenSetSummary}
          tacticalBanner={!isServePanelOpen ? <TacticalInsightBanner insights={tacticalInsights} /> : null}
        />
      </div>

      {/* Grid adaptativo: em paisagem móvel divide ações na direita (2/3) e jogadores na esquerda (1/3) */}
      <div className="flex-1 min-h-0 min-w-0 flex flex-col landscape:flex-row-reverse landscape:items-stretch gap-1 sm:gap-2">
        <div className="landscape:w-2/3 landscape:min-w-0 landscape:flex landscape:flex-col landscape:justify-center flex-shrink-0">
          {isDecidingPoint && match.matchType === 'DOUBLES' && receivingTeam.length === 2 && (
            <div className="mb-0.5">
              <DecidingPointBanner
                receivingTeam={receivingTeam}
                activeReceiverId={activeReceiverId}
                onSelectReceiverOverride={onSelectReceiverOverride}
              />
            </div>
          )}

          {annotationBars}
        </div>

        <div className="flex-1 min-h-0 min-w-0 flex flex-col">
          <PlayAreaPlayers
            player1={match.player1} player2={match.player2}
            player1Partner={match.player1Partner ?? undefined} player2Partner={match.player2Partner ?? undefined}
            activeServerId={activeServerId} activeReceiverId={activeReceiverId}
            scoreState={effectiveScoreState} p1IsServing={p1IsServing} p2IsServing={p2IsServing}
            isSetPoint={isSetPoint} isBreakPoint={isBreakPoint} winner={winner} isFinished={isFinished}
            serverControls={serverControls} onPoint={onPoint} onSwipeUndo={onSwipeUndo}
            onChangeServer={onChangeServer} canChangeServer={canChangeServer}
            awaitingWinnerSelection={awaitingWinnerSelection}
          />
        </div>
      </div>

      <div data-serve-collapse="extras" className="hidden" aria-hidden="true">
        <ContextBadges isMatchPoint={isMatchPoint} isSetPoint={isSetPoint} isBreakPoint={isBreakPoint}
          isTiebreak={isTiebreak} isSuperTiebreak={isSuperTiebreak} pointsHistory={pointsHistory} />
      </div>

      {isFinished && (
        <ScoringFinishedBanner winner={winner} match={match} scoreState={scoreState}
          onNavigateReport={onNavigateReport} onRegisterAndExit={onRegisterAndExit} />
      )}
    </div>
  );
}
