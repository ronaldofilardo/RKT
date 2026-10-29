import { summarizeScore } from '../floating-spectator-summary.logic';

const score = {
  sets: [{ player1: 6, player2: 4 }, { player1: 3, player2: 2 }],
  currentGame: { player1: '40', player2: '30' },
  serverSide: 'side1' as const,
};

describe('summarizeScore', () => {
  it('inclui o game atual quando a partida está em andamento', () => {
    expect(summarizeScore(score, false)).toBe('6-4 3-2 40-30');
  });
  it('omite o game atual quando a partida terminou', () => {
    expect(summarizeScore(score, true)).toBe('6-4 3-2');
  });
});
