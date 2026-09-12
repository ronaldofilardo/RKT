import { filterTimelinePoints, countByFilter } from '../timeline-utils';
import type { TimelinePoint } from '@/core/scoring/types';

describe('timeline-utils - Caracterizacao', () => {
  const points: TimelinePoint[] = [
    {
      id: 'pt-1',
      pointNumber: 1,
      setNumber: 1,
      gameNumber: 1,
      server: 'player1',
      winner: 'PLAYER_1',
      type: 'ACE',
      score: { player1: 15, player2: 0 },
      gameScore: '15-0',
      setScore: '0-0',
      isBreakPoint: false,
      isGameBall: false,
      isSetBall: false,
    },
    {
      id: 'pt-2',
      pointNumber: 2,
      setNumber: 1,
      gameNumber: 1,
      server: 'player1',
      winner: 'PLAYER_2',
      type: 'UNFORCED_ERROR',
      score: { player1: 15, player2: 15 },
      gameScore: '15-15',
      setScore: '0-0',
      isBreakPoint: true,
      isGameBall: false,
      isSetBall: false,
    },
  ];

  it('deve filtrar pontos por vencedor PLAYER_1', () => {
    const result = filterTimelinePoints(points, { playerWinner: 'PLAYER_1' });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('pt-1');
  });

  it('deve filtrar apenas break points', () => {
    const result = filterTimelinePoints(points, { breakPointsOnly: true });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('pt-2');
  });

  it('deve contar pontos usando countByFilter', () => {
    const count = countByFilter(points, p => p.type === 'ACE');
    expect(count).toBe(1);
  });
});
