"use client";

import React from "react";
import CourtBackground from "@/components/scoring/CourtBackground";
import { ScoreboardCard } from "@/components/scoring/ScoreboardCard";
import { ContextBadges } from "@/components/scoring/ContextBadges";
import { LiveCountersBar } from "@/components/scoring/LiveCountersBar";
import { TacticalInsightBanner } from "@/components/scoring/TacticalInsightBanner";
import type { ScoringPlayAreaProps } from "./scoring-play-area.types";
import { PlayAreaPlayers } from "./scoring-play-area-players";

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
        <div className="mt-2 sm:mt-3 bg-yellow-500/20 border-2 border-yellow-400 rounded-2xl p-3 sm:p-5 text-center relative z-10 mx-0">
          <span className="text-2xl sm:text-4xl">🏆</span>
          <h2 className="text-base sm:text-xl font-black text-white mt-1 sm:mt-2">
            PARTIDA FINALIZADA!
          </h2>
          <p className="text-sm sm:text-lg font-bold text-yellow-300 mt-0.5 sm:mt-1">
            VENCEDOR:{" "}
            {winner === "player1" ? match.player1.name : match.player2.name}
          </p>
          <p className="text-[11px] sm:text-sm text-telemetry-text-muted mt-0.5 sm:mt-1">
            {scoreState?.setsWon.player1} x {scoreState?.setsWon.player2} sets
          </p>
          <div className="flex gap-2 sm:gap-3 mt-2 sm:mt-4 justify-center">
            <button
              onClick={onNavigateReport}
              className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-xl text-[11px] sm:text-sm min-h-[44px]"
            >
              📊 Relatório
            </button>
            <button
              onClick={onRegisterAndExit}
              className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-[11px] sm:text-sm border border-white/20 min-h-[44px]"
            >
              ✅ Registrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
