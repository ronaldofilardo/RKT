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
import { abbreviatePlayerName } from "@/components/scoring/doubles-name-abbreviation.logic";

export function ScoringPlayArea({
  match,
  effectiveScoreState,
  suspendedSession,
  liveCounters,
  tacticalInsights,
  completedSetsCount,
  p1IsServing, p2IsServing, activeServerId, activeReceiverId, isSetPoint, isBreakPoint, isMatchPoint,
  isTiebreak, isSuperTiebreak, winner, pointsHistory, scoreState, isFinished,
  serverControls, isServePanelOpen = false,
  onOpenSetSummary, onPoint, onSwipeUndo, onNavigateReport, onRegisterAndExit,
  onChangeServer,
  onSelectReceiverOverride,
  isDecidingPoint = false,
}: ScoringPlayAreaProps) {
  const receivingTeam = p1IsServing
    ? [match.player2, match.player2Partner].filter(Boolean)
    : [match.player1, match.player1Partner].filter(Boolean);

  // flex-1 min-h-0: ocupa o espaço entre header e ActionBar; os cards dos jogadores
  // absorvem a sobra/falta de altura. SEM scroll interno: com o painel de detalhes
  // aberto, blocos secundários recolhem via [data-serve-collapse] (globals.css).
  return (
    <div
      data-serve-panel={isServePanelOpen ? 'open' : 'closed'}
      className="flex-1 min-h-0 flex flex-col gap-1 px-2 sm:px-3 py-1 sm:py-2 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <CourtBackground courtType={match.courtType} />
      </div>

      <div className="my-0.5 sm:my-2 flex-shrink-0">
        <ScoreboardCard player1={match.player1} player2={match.player2} player1Partner={match.player1Partner ?? undefined} player2Partner={match.player2Partner ?? undefined} scoreState={effectiveScoreState} isSuspended={!!suspendedSession} format={match.format as string} />
      </div>

      {/* Boxes de Estatísticas ao Vivo e Insight Tático */}
      <div className="flex flex-col gap-1 flex-shrink-0" data-serve-collapse="stats">
        <LiveCountersBar
          counters={liveCounters}
          player1Name={match.player1.name}
          player2Name={match.player2.name}
          completedSetsCount={completedSetsCount}
          onOpenSetSummary={onOpenSetSummary}
          p1IsServing={p1IsServing}
          p2IsServing={p2IsServing}
        />
        {!isServePanelOpen && <TacticalInsightBanner insights={tacticalInsights} />}
      </div>

      {isDecidingPoint && match.matchType === 'DOUBLES' && receivingTeam.length === 2 && (
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-telemetry-elevated/90 border border-telemetry-volt/30 shadow-md flex-shrink-0 animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">⚡</span>
            <span className="text-xs font-bold text-telemetry-volt">Ponto decisivo — No-Ad</span>
            <span className="text-[11px] text-telemetry-text-muted hidden sm:inline">Quem recebe agora?</span>
          </div>
          <div className="flex gap-1">
            {receivingTeam.map((member) => {
              if (!member) return null;
              const isSelected = activeReceiverId === member.id;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => onSelectReceiverOverride?.(member.id)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                    isSelected
                      ? 'bg-telemetry-volt text-black ring-1 ring-white/40'
                      : 'bg-telemetry-card text-telemetry-text-muted hover:text-white'
                  }`}
                >
                  {abbreviatePlayerName(member.name)} {isSelected ? '✓' : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

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
        serverControls={serverControls}
        onPoint={onPoint}
        onSwipeUndo={onSwipeUndo}
        onChangeServer={onChangeServer}
      />

      <div data-serve-collapse="extras" className="contents">
        <ContextBadges
          isMatchPoint={isMatchPoint} isSetPoint={isSetPoint} isBreakPoint={isBreakPoint}
          isTiebreak={isTiebreak} isSuperTiebreak={isSuperTiebreak} pointsHistory={pointsHistory}
        />
      </div>

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
