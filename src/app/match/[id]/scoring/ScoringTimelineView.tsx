"use client";

import React from "react";
import { MatchHeader } from "@/components/scoring/MatchHeader";
import { MatchTimelineView } from "@/components/scoring/MatchTimelineView";
import type { TimelinePoint } from "@/core/scoring/types";

interface ScoringTimelineViewProps {
  fontScale: number;
  elapsed: number;
  isFinished: boolean;
  abandonCurrentSession: (snapshot?: string) => Promise<unknown>;
  onCloseTimeline: () => void;
  matchId: string;
  timelinePoints: TimelinePoint[];
  player1Name: string;
  player2Name: string;
  comments?: any[];
  onNavigateReport: () => void;
  onNavigateDashboard: () => void;
}

export function ScoringTimelineView({
  fontScale,
  elapsed,
  isFinished,
  abandonCurrentSession,
  onCloseTimeline,
  matchId,
  timelinePoints,
  player1Name,
  player2Name,
  comments,
  onNavigateReport,
  onNavigateDashboard,
}: ScoringTimelineViewProps) {
  return (
    <div
      className="min-h-screen bg-telemetry-base flex flex-col"
      style={{ fontSize: `${fontScale * 100}%` }}
    >
      <MatchHeader
        elapsedSeconds={elapsed}
        onClose={async () => {
          await abandonCurrentSession();
          onNavigateDashboard();
        }}
        onTimeline={onCloseTimeline}
        isFinished={isFinished}
      />
      <div className="flex-1 flex flex-col px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onCloseTimeline}
            className="px-4 py-1.5 bg-telemetry-card border border-white/10 hover:bg-telemetry-elevated text-telemetry-text-primary font-semibold rounded-lg text-sm transition-colors"
          >
            ← Placar
          </button>
          <span className="text-xs text-telemetry-text-muted">
            {timelinePoints.length} pontos
          </span>
          <button
            onClick={onNavigateReport}
            className="px-4 py-1.5 bg-telemetry-card border border-white/10 hover:bg-telemetry-elevated text-telemetry-text-primary font-semibold rounded-lg text-sm transition-colors"
          >
            Relatório →
          </button>
        </div>
        <div className="flex-1 bg-telemetry-card rounded-xl border border-white/10 p-4 overflow-hidden">
          <MatchTimelineView
            points={timelinePoints}
            player1Name={player1Name}
            player2Name={player2Name}
            matchId={matchId}
            comments={comments}
          />
        </div>
      </div>
    </div>
  );
}
