import type { SpectatorMarker, SpectatorPoint } from '@/core/spectate';

export type SpectatorTimelineItem =
  | { type: 'point'; point: SpectatorPoint }
  | { type: 'marker'; marker: SpectatorMarker };

/**
 * Intercala marcadores (edição de placar etc.) aos pontos, em ordem cronológica.
 * Marcador com `afterSeq` fica depois do último ponto de sequência <= afterSeq;
 * sem `afterSeq` vai para o fim.
 */
export function buildTimelineItems(points: SpectatorPoint[], markers: SpectatorMarker[]): SpectatorTimelineItem[] {
  const buckets = new Map<number, SpectatorMarker[]>();
  const sorted = [...markers].sort((a, b) => a.at.localeCompare(b.at));

  for (const m of sorted) {
    let pos = points.length;
    if (typeof m.afterSeq === 'number') {
      pos = 0;
      points.forEach((p, i) => {
        if (p.seq <= (m.afterSeq as number)) pos = i + 1;
      });
    }
    buckets.set(pos, [...(buckets.get(pos) ?? []), m]);
  }

  const items: SpectatorTimelineItem[] = [];
  for (let pos = 0; pos <= points.length; pos++) {
    for (const marker of buckets.get(pos) ?? []) items.push({ type: 'marker', marker });
    if (pos < points.length) items.push({ type: 'point', point: points[pos] });
  }
  return items;
}
