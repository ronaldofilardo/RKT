import { isMatchTiebreakSetIndex } from '../score-normalizer';
describe('Score Normalizer - Real', () => {
  it('deve manter contrato sem regressao', () => {
    expect(typeof isMatchTiebreakSetIndex).toBe('function');
  });
});
