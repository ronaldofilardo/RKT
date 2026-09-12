import { formatSetScore, formatGamePoints } from '../match-card-utils';

describe('src/components/dashboard/match-card-utils.ts Caracterizacao', () => {
  it('deve formatar pontuacao de set comum corretamente', () => {
    expect(formatSetScore({ player1: 6, player2: 4 })).toBe('6/4');
  });

  it('deve formatar pontuacao de tiebreak com placar do perdedor entre parenteses', () => {
    expect(
      formatSetScore({
        player1: 7,
        player2: 6,
        isTiebreak: true,
        tiebreakScore: { player1: 7, player2: 5 },
      })
    ).toBe('7/6(5)');
  });

  it('deve formatar pontos de game normal', () => {
    const formatted = formatGamePoints({ player1: 1, player2: 2 });
    expect(formatted).toBe('15-30');
  });
});
