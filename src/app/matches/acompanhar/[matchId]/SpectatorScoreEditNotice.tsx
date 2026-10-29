import React from 'react';
import type { SpectatorMarker } from '@/core/spectate';

/** Aviso permanente sob o placar quando a partida teve ajuste manual de placar. */
export function SpectatorScoreEditNotice({ markers }: { markers: SpectatorMarker[] }) {
  const edits = markers.filter((m) => m.kind === 'SCORE_EDIT');
  if (edits.length === 0) return null;
  const last = edits[edits.length - 1];

  return (
    <p
      data-testid="score-edit-notice"
      className="m-0 text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5"
    >
      ⚠️ O placar foi ajustado manualmente pelo anotador{edits.length > 1 ? ` (${edits.length} vezes)` : ''}
      {last.from && last.to ? `: de ${last.from} para ${last.to}.` : '.'} Pontos entre esses placares não aparecem no histórico.
    </p>
  );
}
