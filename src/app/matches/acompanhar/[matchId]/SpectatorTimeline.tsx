'use client';

import React from 'react';
import { describeSpectatorPoint, type SpectatorMarker, type SpectatorPoint } from '@/core/spectate';
import { BADGE_COLORS } from '@/components/scoring/timeline-row.logic';
import { buildSpectatorDetailChips } from './spectator-point-detail.logic';
import { buildTimelineItems } from './spectator-timeline-items.logic';
import { SpectatorScoreEditMarker } from './SpectatorScoreEditMarker';

function DetailLegend() {
  return (
    <details className="mt-2 text-[11px] text-telemetry-text-muted">
      <summary className="cursor-pointer select-none">Legenda das abreviações</summary>
      <p className="mt-1 leading-relaxed m-0">
        <strong>DEV</strong> devolução · <strong>FQ</strong> fundo de quadra · <strong>Pass</strong> passada ·{' '}
        <strong>Rede</strong> · <strong>W</strong> winner · <strong>ENF</strong> erro não forçado ·{' '}
        <strong>EF</strong> erro forçado · <strong>FH/BH</strong> forehand/backhand · <strong>Top/Sl/Flat</strong>{' '}
        efeito · <strong>X</strong> cruzada · <strong>Parl</strong> paralela · <strong>Ce</strong> centro ·{' '}
        <strong>In Out/In In</strong> inside-out/in · <strong>1-4, 5-8, +9</strong> bolas no rallye
      </p>
    </details>
  );
}

export function SpectatorTimeline({
  points,
  side1Label,
  side2Label,
  markers = [],
}: {
  points: SpectatorPoint[];
  side1Label: string;
  side2Label: string;
  markers?: SpectatorMarker[];
}) {
  if (points.length === 0 && markers.length === 0) {
    return (
      <div className="text-center py-8 text-telemetry-text-muted text-[13px]">
        Nenhum ponto registrado até o momento.
      </div>
    );
  }

  const reversed = buildTimelineItems(points, markers).reverse();
  const hasAnyDetail = points.some((p) => Boolean(p.details));

  return (
    <div className="flex flex-col">
      {reversed.map((item, idx) => {
        if (item.type === 'marker') {
          return <SpectatorScoreEditMarker key={`marker-${item.marker.kind}-${item.marker.at}-${idx}`} marker={item.marker} />;
        }
        const p = item.point;
        const winnerName = p.winnerSide === 'side1' ? side1Label : side2Label;
        const desc = describeSpectatorPoint(p.type);
        const chips = buildSpectatorDetailChips(p);
        return (
          <div
            key={p.id}
            className="flex items-baseline gap-2.5 py-2 border-t border-telemetry-border/10 first:border-t-0 text-[13px]"
          >
            <span className="text-telemetry-text-muted font-mono text-xs min-w-[72px] flex-none">
              {`G${p.gameNumber}${p.scoreAfter ? ` · ${p.scoreAfter}` : ''}`}
            </span>
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="text-telemetry-text-primary truncate">
                {winnerName} · {desc}
              </span>
              {chips.length > 0 && (
                <div className="flex flex-wrap gap-1" data-testid="point-detail-chips">
                  {chips.map((c, i) => (
                    <span
                      key={`${c.text}-${i}`}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-medium leading-none ${BADGE_COLORS[c.tone]}`}
                    >
                      {c.text}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
      {hasAnyDetail && <DetailLegend />}
    </div>
  );
}
