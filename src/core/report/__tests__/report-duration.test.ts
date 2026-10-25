import type { TimelinePoint } from '@/core/scoring/types';
import { computeMatchDurations } from '../report-duration.logic';

function createPointWithTime(
  pointNumber: number,
  setNumber: number,
  isoTime: string,
): TimelinePoint {
  return {
    pointNumber,
    winner: 'PLAYER_1',
    type: 'WINNER',
    server: 'player1',
    isFirstServe: true,
    isSecondServe: false,
    gameScore: { player1: 15, player2: 0 },
    gamesScore: { player1: 0, player2: 0 },
    setNumber,
    isBreakPoint: false,
    isGameBall: false,
    isSetBall: false,
    rallyLength: 3,
    rallyDetails: null,
    recordedAt: isoTime,
    pointDetails: {} as any,
  };
}

describe('Fase 3 - Tempos Total e Efetivo', () => {
  it('calcula duração total, efetiva e ignora intervalos > 90s e transições de set', () => {
    const t0 = new Date('2026-10-25T10:00:00.000Z');
    const t1 = new Date(t0.getTime() + 30 * 1000); // +30s (Set 1) -> efetivo
    const t2 = new Date(t1.getTime() + 45 * 1000); // +45s (Set 1) -> efetivo
    const t3 = new Date(t2.getTime() + 150 * 1000); // +150s (Set 1) -> > 90s, descartado do efetivo
    const t4 = new Date(t3.getTime() + 60 * 1000); // +60s (Transição para Set 2) -> cruza set, descartado do efetivo
    const t5 = new Date(t4.getTime() + 25 * 1000); // +25s (Set 2) -> efetivo

    const points: TimelinePoint[] = [
      createPointWithTime(1, 1, t0.toISOString()),
      createPointWithTime(2, 1, t1.toISOString()),
      createPointWithTime(3, 1, t2.toISOString()),
      createPointWithTime(4, 1, t3.toISOString()),
      createPointWithTime(5, 2, t4.toISOString()),
      createPointWithTime(6, 2, t5.toISOString()),
    ];

    const stats = computeMatchDurations(points);

    // Tempo total: de t0 a t5 = 30 + 45 + 150 + 60 + 25 = 310s = 5 minutos
    expect(stats.totalDurationMinutes).toBe(5);

    // Tempo efetivo: 30s + 45s (Set 1) + 25s (Set 2) = 100s
    expect(stats.effectiveDurationSeconds).toBe(100);
    expect(stats.effectiveDurationMinutes).toBe(2);

    // Gaps medidos: 3 intervalos válidos (t0-t1: 30s, t1-t2: 45s, t4-t5: 25s)
    // Média por ponto: 100 / 3 = 33.3s
    expect(stats.effectiveSecondsPerPoint).toBe(33.3);

    // Sets
    expect(stats.setDurations).toHaveLength(2);
    expect(stats.setDurations[0].setNumber).toBe(1);
    expect(stats.setDurations[0].effectiveSeconds).toBe(75); // 30 + 45
    expect(stats.setDurations[1].setNumber).toBe(2);
    expect(stats.setDurations[1].effectiveSeconds).toBe(25); // 25
  });
});
