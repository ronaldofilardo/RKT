import { computeSpectatorStats } from '../spectator-stats';
import type { SpectatorPoint } from '../types';

const pt = (over: Partial<SpectatorPoint>): SpectatorPoint => ({
  id: Math.random().toString(),
  seq: 1,
  setNumber: 1,
  gameNumber: 1,
  scoreAfter: '',
  winnerSide: 'side1',
  serverSide: 'side1',
  type: 'WINNER',
  ...over,
});

describe('computeSpectatorStats', () => {
  it('conta aces para quem ganhou e erros/duplas faltas para quem perdeu', () => {
    const s = computeSpectatorStats([
      pt({ type: 'ACE', winnerSide: 'side1' }),
      pt({ type: 'DOUBLE_FAULT', winnerSide: 'side2', serverSide: 'side1' }),
      pt({ type: 'UNFORCED_ERROR', winnerSide: 'side1' }),
      pt({ type: 'FORCED_ERROR', winnerSide: 'side1' }),
    ]);
    expect(s.side1.aces).toBe(1);
    expect(s.side1.doubleFaults).toBe(1);
    expect(s.side2.unforcedErrors).toBe(1);
    expect(s.side2.forcedErrors).toBe(1);
    expect(s.side1.points).toBe(3);
    expect(s.side2.points).toBe(1);
  });

  it('atribui break point a quem devolve e conta conversão', () => {
    const s = computeSpectatorStats([
      pt({ isBreakPoint: true, serverSide: 'side1', winnerSide: 'side2' }),
      pt({ isBreakPoint: true, serverSide: 'side1', winnerSide: 'side1' }),
    ]);
    expect(s.side2.breakPointsTotal).toBe(2);
    expect(s.side2.breakPointsWon).toBe(1);
    expect(s.side1.breakPointsTotal).toBe(0);
  });
});
