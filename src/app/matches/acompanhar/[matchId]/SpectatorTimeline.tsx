'use client';

import React from 'react';
import { describeSpectatorPoint, type SpectatorMarker, type SpectatorPoint } from '@/core/spectate';
import { buildSpectatorDetailChips } from './spectator-point-detail.logic';
import { buildTimelineItems } from './spectator-timeline-items.logic';
import { SpectatorScoreEditMarker } from './SpectatorScoreEditMarker';
import { badgeClass } from './spectator-timeline-badge.logic';
import { DetailLegend } from './SpectatorDetailLegend';
import { getWinnerInitials } from './spectator-timeline-initials.logic';

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
      <div className="py-6 text-center font-mono text-xs text-telemetry-text-muted">
        Nenhum ponto registrado até o momento.
      </div>
    );
  }

  const reversed = buildTimelineItems(points, markers).reverse();
  const hasAnyDetail = points.some((p) => Boolean(p.details));

  const side1Initials = getWinnerInitials(side1Label);
  const side2Initials = getWinnerInitials(side2Label);

  return (
    <div className="divide-y divide-telemetry-border/5 px-4" aria-label="Linha do tempo de pontos">
      {reversed.map((item, idx) => {
        if (item.type === 'marker') {
          return <SpectatorScoreEditMarker key={`marker-${item.marker.kind}-${item.marker.at}-${idx}`} marker={item.marker} />;
        }
        const p = item.point;
        const isPlayer1 = p.winnerSide === 'side1';
        const winnerInitials = isPlayer1 ? side1Initials : side2Initials;
        const desc = describeSpectatorPoint(p.type);
        const chips = buildSpectatorDetailChips(p);

        return (
          <div
            key={p.id}
            className="tab-pane-enter flex items-start gap-3 py-2"
          >
            <span className="w-10 shrink-0 font-mono text-xs tabular-nums text-telemetry-text-muted">
              {`G${p.gameNumber}${p.scoreAfter ? ` · ${p.scoreAfter}` : ''}`}
            </span>
            <div
              className={`min-w-0 flex-1 space-y-1.5 ${isPlayer1 ? 'text-left' : 'text-right'}`}
            >
              <p className="truncate font-mono text-sm text-telemetry-text-primary">
                <span
                  className={`font-semibold ${
                    isPlayer1 ? 'text-telemetry-text-primary' : 'text-telemetry-volt'
                  }`}
                >
                  {winnerInitials}
                </span>
                {' · '}
                <span>{desc}</span>
              </p>

              {chips.length > 0 && (
                <div
                  className={`flex flex-wrap gap-1 ${isPlayer1 ? 'justify-start' : 'justify-end'}`}
                  data-testid="point-detail-chips"
                >
                  {chips.map((c, i) => (
                    <span
                      key={`${c.text}-${i}`}
                      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none ${badgeClass(c.tone)}`}
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
