"use client";

import React from "react";
import CourtBackground from "@/components/scoring/CourtBackground";
import { ScoreboardCard } from "@/components/scoring/ScoreboardCard";
import { ContextBadges } from "@/components/scoring/ContextBadges";
import { LiveCountersBar } from "@/components/scoring/LiveCountersBar";
import { TacticalInsightBanner } from "@/components/scoring/TacticalInsightBanner";
import type { ScoringPlayAreaProps } from "./scoring-play-area.types";
import { PlayAreaPlayers } from "./scoring-play-area-players";
import { ScoringFinishedBanner } from "./scoring-finished-banner";

export function ScoringPlayArea({
  match,
  effectiveScoreState,
  suspendedSession,
  liveCounters,
  tacticalInsights,
  completedSetsCount,
  p1IsServing, p2IsServing, activeServerId, activeReceiverId, isSetPoint, isBreakPoint, isMatchPoint,
  isTiebreak, isSuperTiebreak, winner, pointsHistory, scoreState, isFinished,
  onOpenSetSummary, onPoint, onSwipeUndo, onNavigateReport, onRegisterAndExit,
}: ScoringPlayAreaProps) {
  // flex-1 min-h-0: ocupa o espaço entre header e ActionBar; os cards dos jogadores
  // absorvem a sobra/falta de altura. overflow-y-auto é só rede de segurança para
  // telas muito baixas (o ActionBar fica sempre visível, fora desta área).
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-1 px-2 sm:px-3 py-1 sm:py-2 relative overflow-y-auto overflow-x-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <CourtBackground courtType={match.courtType} />
      </div>

      <div className="my-0.5 sm:my-2 flex-shrink-0">
        <ScoreboardCard player1={match.player1} player2={match.player2} scoreState={effectiveScoreState} isSuspended={!!suspendedSession} format={match.format as string} />
      </div>

      {/* Boxes de Estatísticas ao Vivo e Insight Tático */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        <LiveCountersBar
          counters={liveCounters}
          player1Name={match.player1.name}
          player2Name={match.player2.name}
          completedSetsCount={completedSetsCount}
          onOpenSetSummary={onOpenSetSummary}
        />
        <TacticalInsightBanner insights={tacticalInsights} />
      </div>

      <PlayAreaPlayers
        player1={match.player1}
        player2={match.player2}
        player1Partner={match.player1Partner ?? undefined}
        player2Partner={match.player2Partner ?? undefined}
        activeServerId={activeServerId}
        activeReceiverId={activeReceiverId}
        scoreState={effectiveScoreState}
        p1IsServing={p1IsServing}
        p2IsServing={p2IsServing}
        isSetPoint={isSetPoint}
        isBreakPoint={isBreakPoint}
        winner={winner}
        isFinished={isFinished}
        onPoint={onPoint}
        onSwipeUndo={onSwipeUndo}
      />

      <ContextBadges
        isMatchPoint={isMatchPoint} isSetPoint={isSetPoint} isBreakPoint={isBreakPoint}
        isTiebreak={isTiebreak} isSuperTiebreak={isSuperTiebreak} pointsHistory={pointsHistory}
      />

      {isFinished && (
        <ScoringFinishedBanner
          winner={winner}
          match={match}
          scoreState={scoreState}
          onNavigateReport={onNavigateReport}
          onRegisterAndExit={onRegisterAndExit}
        />
      )}
    </div>
  );
}
