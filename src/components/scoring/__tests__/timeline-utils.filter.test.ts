/**
 * Split de timeline-utils.test.ts — describes "filterTimelinePoints" e
 * "countByFilter": filtragem e contagem de pontos do timeline. Asserções 1:1.
 */
import { filterTimelinePoints, countByFilter } from '../timeline.logic';
import { COUNT_POINTS, FILTER_POINTS } from './timelineUtilsTestKit';

describe('filterTimelinePoints', () => {
  const points = FILTER_POINTS;

  it('deve filtrar por playerWinner', () => {
    const filtered = filterTimelinePoints(points, { playerWinner: 'PLAYER_1' });
    expect(filtered).toHaveLength(2);
  });

  it('deve filtrar por breakPointsOnly', () => {
    const filtered = filterTimelinePoints(points, { breakPointsOnly: true });
    expect(filtered).toHaveLength(2);
  });

  it('deve filtrar por winnersOnly', () => {
    const filtered = filterTimelinePoints(points, { winnersOnly: true });
    expect(filtered).toHaveLength(2);
  });

  it('deve filtrar por errorsOnly', () => {
    const filtered = filterTimelinePoints(points, { errorsOnly: true });
    expect(filtered).toHaveLength(2);
  });

  it('deve combinar filtros', () => {
    const filtered = filterTimelinePoints(points, {
      playerWinner: 'PLAYER_2',
      errorsOnly: true,
    });
    expect(filtered).toHaveLength(2);
  });
});

describe('countByFilter', () => {
  const points = COUNT_POINTS;

  it('deve contar pontos quebrados', () => {
    const count = countByFilter(points, (p) => p.isBreakPoint);
    expect(count).toBe(2);
  });

  it('deve contar winners de player1', () => {
    const count = countByFilter(points, (p) => p.winner === 'PLAYER_1' && (p.type === 'WINNER' || p.type === 'ACE'));
    expect(count).toBe(2);
  });
});
