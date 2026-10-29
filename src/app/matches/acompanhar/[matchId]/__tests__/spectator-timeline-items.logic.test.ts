import { buildTimelineItems } from '../spectator-timeline-items.logic';
import type { SpectatorMarker, SpectatorPoint } from '@/core/spectate';

const pt = (seq: number): SpectatorPoint => ({
  id: `p${seq}`, seq, setNumber: 1, gameNumber: 1, scoreAfter: '', winnerSide: 'side1', type: 'WINNER',
});
const marker = (afterSeq?: number | null, at = '2026-10-29T12:00:00Z'): SpectatorMarker => ({
  kind: 'SCORE_EDIT', at, description: 'x', afterSeq,
});

const shape = (items: ReturnType<typeof buildTimelineItems>) =>
  items.map((i) => (i.type === 'point' ? `p${i.point.seq}` : 'M'));

describe('buildTimelineItems', () => {
  it('insere o marcador depois do ponto indicado', () => {
    expect(shape(buildTimelineItems([pt(1), pt(2), pt(3)], [marker(2)]))).toEqual(['p1', 'p2', 'M', 'p3']);
  });

  it('afterSeq 0 vai antes do primeiro ponto e ausente vai para o fim', () => {
    expect(shape(buildTimelineItems([pt(1), pt(2)], [marker(0)]))).toEqual(['M', 'p1', 'p2']);
    expect(shape(buildTimelineItems([pt(1), pt(2)], [marker(null)]))).toEqual(['p1', 'p2', 'M']);
  });

  it('funciona sem pontos', () => {
    expect(shape(buildTimelineItems([], [marker(0)]))).toEqual(['M']);
  });
});
