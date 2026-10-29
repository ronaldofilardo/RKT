import { computeScoreAfterLabels, type ScoreAfterTimelinePoint } from '../score-after';

const tp = (g1: number, g2: number, games: [number, number] = [0, 0], set = 1): ScoreAfterTimelinePoint => ({
  setNumber: set,
  gamesScore: { player1: games[0], player2: games[1] },
  gameScore: { player1: g1, player2: g2 },
});

describe('computeScoreAfterLabels', () => {
  it('usa o placar do ponto seguinte dentro do mesmo game e o placar atual no último ponto', () => {
    const labels = computeScoreAfterLabels([tp(0, 0), tp(1, 0), tp(1, 1)], { player1: '30', player2: '15' });
    expect(labels).toEqual(['15-0', '15-15', '30-15']);
  });

  it('mostra resultado em games quando o game virou', () => {
    const labels = computeScoreAfterLabels([tp(3, 0), tp(0, 0, [1, 0])], { player1: '0', player2: '0' });
    expect(labels[0]).toBe('Game 1-0');
    expect(labels[1]).toBe('Game');
  });

  it('indica fim de set quando o set muda', () => {
    const labels = computeScoreAfterLabels([tp(3, 0, [5, 0]), tp(0, 0, [0, 0], 2)], { player1: '0', player2: '0' });
    expect(labels[0]).toBe('Fim do set');
  });
});
