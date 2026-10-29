import React from 'react';
import type { SpectatorMarker } from '@/core/spectate';

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Linha de destaque na timeline: o anotador ajustou o placar manualmente. */
export function SpectatorScoreEditMarker({ marker }: { marker: SpectatorMarker }) {
  const isScoreEdit = marker.kind === 'SCORE_EDIT';
  const time = timeLabel(marker.at);

  return (
    <div
      data-testid="timeline-marker"
      className="my-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200"
    >
      <p className="m-0 font-semibold">
        ⚠️ {isScoreEdit ? 'Placar ajustado pelo anotador' : 'Ajuste do anotador'}
        {time ? ` · ${time}` : ''}
      </p>
      {isScoreEdit && marker.from && marker.to ? (
        <div className="mt-1 space-y-0.5 font-mono text-[11px]">
          <p className="m-0"><span className="text-amber-300/70">Antes:</span> {marker.from}</p>
          <p className="m-0"><span className="text-amber-300/70">Agora:</span> {marker.to}</p>
        </div>
      ) : (
        <p className="m-0 mt-1 text-[11px]">{marker.description}</p>
      )}
      {isScoreEdit && (
        <p className="m-0 mt-1 text-[11px] text-amber-300/80">
          Os pontos entre esses dois placares não foram anotados.
        </p>
      )}
    </div>
  );
}
