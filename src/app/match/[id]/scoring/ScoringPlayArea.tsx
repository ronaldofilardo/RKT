"use client";

import React from "react";
import CourtBackground from "@/components/scoring/CourtBackground";
import { ScoreboardCard } from "@/components/scoring/ScoreboardCard";
import { PlayerCard } from "@/components/scoring/PlayerCard";
import { ContextBadges } from "@/components/scoring/ContextBadges";
import { LiveCountersBar } from "@/components/scoring/LiveCountersBar";
import { TacticalInsightBanner } from "@/components/scoring/TacticalInsightBanner";
import type { LiveMatchCounters, TacticalInsight } from "@/core/scoring/live-tactical-insights";
import type { ScoringPageState } from "./useScoringPageState";
import type { ScoringPageDerived } from "./useScoringPageDerived";

interface ScoringPlayAreaProps {
  match: NonNullable<ScoringPageState["match"]>;
  effectiveScoreState: ScoringPageDerived["effectiveScoreState"];
  suspendedSession: ScoringPageState["suspendedSession"];
  liveCounters: LiveMatchCounters;
  tacticalInsights: TacticalInsight[];
  completedSetsCount: number;
  p1IsServing: boolean;
  p2IsServing: boolean;
  isSetPoint: boolean;
  isBreakPoint: boolean;
  isMatchPoint: boolean;
  isTiebreak: boolean;
  isSuperTiebreak: boolean;
  winner: string | null;
  pointsHistory: ScoringPageState["pointsHistory"];
  scoreState: ScoringPageState["scoreState"];
  isFinished: boolean;
  matchId: string;
  onOpenSetSummary: () => void;
  onPoint: (side: "player1" | "player2") => void;
  onSwipeUndo: () => void;
  onNavigateReport: () => void;
  onRegisterAndExit: () => Promise<void>;
}

export function ScoringPlayArea({
  match,
  effectiveScoreState,
  suspendedSession,
  liveCounters,
  tacticalInsights,
  completedSetsCount,
  p1IsServing,
  p2IsServing,
  isSetPoint,
  isBreakPoint,
  isMatchPoint,
  isTiebreak,
  isSuperTiebreak,
  winner,
  pointsHistory,
  scoreState,
  isFinished,
  onOpenSetSummary,
  onPoint,
  onSwipeUndo,
  onNavigateReport,
  onRegisterAndExit,
}: ScoringPlayAreaProps) {
  return (
    <div className="flex-1 flex flex-col gap-0 sm:gap-1 px-2 sm:px-3 py-1 sm:py-2 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <CourtBackground courtType={match.courtType} />
      </div>

      <div className="my-1 sm:my-2 flex-shrink-0">
        <ScoreboardCard
          player1={match.player1}
          player2={match.player2}
          scoreState={effectiveScoreState}
          isSuspended={!!suspendedSession}
          format={match.format as string}
        />
      </div>

      {/* Boxes de Estatísticas ao Vivo e Insight Tático */}
      <div className="flex flex-col gap-1 my-0.5 flex-shrink-0">
        <LiveCountersBar
          counters={liveCounters}
          player1Name={match.player1.name}
          player2Name={match.player2.name}
          completedSetsCount={completedSetsCount}
          onOpenSetSummary={onOpenSetSummary}
        />
        <TacticalInsightBanner insights={tacticalInsights} />
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-1 relative z-10 min-h-0">
        <div className="flex-1 min-w-0">
          <PlayerCard
            player={match.player1}
            side="player1"
            scoreState={effectiveScoreState}
            isServing={p1IsServing}
            isSetPoint={isSetPoint}
            isBreakPoint={isBreakPoint}
            isWinner={winner === "player1"}
            onPoint={() => onPoint("player1")}
            onSwipeDown={onSwipeUndo}
            disabled={isFinished}
          />
        </div>

        <div className="w-px h-full bg-white/10 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <PlayerCard
            player={match.player2}
            side="player2"
            scoreState={effectiveScoreState}
            isServing={p2IsServing}
            isSetPoint={isSetPoint}
            isBreakPoint={isBreakPoint}
            isWinner={winner === "player2"}
            onPoint={() => onPoint("player2")}
            onSwipeDown={onSwipeUndo}
            disabled={isFinished}
          />
        </div>
      </div>

      <ContextBadges
        isMatchPoint={isMatchPoint}
        isSetPoint={isSetPoint}
        isBreakPoint={isBreakPoint}
        isTiebreak={isTiebreak}
        isSuperTiebreak={isSuperTiebreak}
        pointsHistory={pointsHistory}
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
