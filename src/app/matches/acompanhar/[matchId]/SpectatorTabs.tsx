'use client';

import React, { useMemo, useState } from 'react';
import { computeSpectatorStats } from '@/core/spectate/spectator-stats';
import type { SpectatorView } from '@/core/spectate/types';
import { SpectatorTimeline } from './SpectatorTimeline';

function StatRow({ left, label, right }: { left: React.ReactNode; label: string; right: React.ReactNode }) {
  return (
    <div className="flex justify-between font-mono">
      <span>{left}</span>
      <span className="font-sans text-telemetry-text-muted">{label}</span>
      <span>{right}</span>
    </div>
  );
}

export function SpectatorTabs({ view }: { view: SpectatorView }) {
  const [activeTab, setActiveTab] = useState<'points' | 'summary' | 'stats'>('points');
  const side1 = view.match.sides[0];
  const side2 = view.match.sides[1];
  const { side1: s1, side2: s2 } = useMemo(() => computeSpectatorStats(view.points), [view.points]);

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
        <SpectatorTimeline points={view.points} side1Label={side1.label} side2Label={side2.label} markers={view.markers ?? []} />
      )}

      {activeTab === 'summary' && (
        <div className="bg-telemetry-base/60 border border-telemetry-border/10 rounded-xl p-3 text-xs space-y-2">
          <div className="flex justify-between text-telemetry-text-muted pb-1 border-b border-telemetry-border/10">
            <span>{side1.label}</span>
            <span>Métrica</span>
            <span>{side2.label}</span>
          </div>
          <StatRow left={s1.points} label="Total de Pontos" right={s2.points} />
          <StatRow left={s1.winners} label="Winners" right={s2.winners} />
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="bg-telemetry-base/60 border border-telemetry-border/10 rounded-xl p-3 text-xs space-y-2">
          <div className="flex justify-between text-telemetry-text-muted pb-1 border-b border-telemetry-border/10">
            <span>{side1.label}</span>
            <span>Golpe</span>
            <span>{side2.label}</span>
          </div>
          <StatRow left={s1.aces} label="Aces" right={s2.aces} />
          <StatRow left={s1.doubleFaults} label="Duplas Faltas" right={s2.doubleFaults} />
          <StatRow
            left={`${s1.breakPointsWon}/${s1.breakPointsTotal}`}
            label="Break Points"
            right={`${s2.breakPointsWon}/${s2.breakPointsTotal}`}
          />
          <StatRow left={s1.forcedErrors} label="Erros Forçados" right={s2.forcedErrors} />
          <StatRow left={s1.unforcedErrors} label="Erros Não Forçados" right={s2.unforcedErrors} />
        </div>
      )}
    </div>
  );
}
