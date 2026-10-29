'use client';

import React, { useState } from 'react';
import type { SpectatorView } from '@/core/spectate';
import { SpectatorTimeline } from './SpectatorTimeline';

export function SpectatorTabs({ view }: { view: SpectatorView }) {
  const [activeTab, setActiveTab] = useState<'points' | 'summary' | 'stats'>('points');
  const side1 = view.match.sides[0];
  const side2 = view.match.sides[1];

  const p1Points = view.points.filter((p) => p.winnerSide === 'side1').length;
  const p2Points = view.points.filter((p) => p.winnerSide === 'side2').length;
  const p1Aces = view.points.filter((p) => p.winnerSide === 'side1' && p.type === 'ACE').length;
  const p2Aces = view.points.filter((p) => p.winnerSide === 'side2' && p.type === 'ACE').length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex border-b border-telemetry-border/10">
        {(['points', 'summary', 'stats'] as const).map((tab) => {
          const labels = { points: 'Pontos', summary: 'Resumo', stats: 'Estatísticas' };
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-[13px] font-medium transition-colors border-b-2 -mb-[1px] ${
                isActive
                  ? 'text-telemetry-text-primary border-telemetry-text-primary'
                  : 'text-telemetry-text-muted border-transparent hover:text-telemetry-text-primary'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {activeTab === 'points' && (
        <SpectatorTimeline points={view.points} side1Label={side1.label} side2Label={side2.label} />
      )}

      {activeTab === 'summary' && (
        <div className="bg-telemetry-base/60 border border-telemetry-border/10 rounded-xl p-3 text-xs space-y-2">
          <div className="flex justify-between text-telemetry-text-muted pb-1 border-b border-telemetry-border/10">
            <span>{side1.label}</span>
            <span>Métrica</span>
            <span>{side2.label}</span>
          </div>
          <div className="flex justify-between font-mono">
            <span>{p1Points}</span>
            <span className="font-sans text-telemetry-text-muted">Total de Pontos</span>
            <span>{p2Points}</span>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="bg-telemetry-base/60 border border-telemetry-border/10 rounded-xl p-3 text-xs space-y-2">
          <div className="flex justify-between text-telemetry-text-muted pb-1 border-b border-telemetry-border/10">
            <span>{side1.label}</span>
            <span>Golpe</span>
            <span>{side2.label}</span>
          </div>
          <div className="flex justify-between font-mono">
            <span>{p1Aces}</span>
            <span className="font-sans text-telemetry-text-muted">Aces</span>
            <span>{p2Aces}</span>
          </div>
        </div>
      )}
    </div>
  );
}
