import { getMatchFormatDisplayLabel, formatClubMatchScore } from '../club-matches.logic';

describe('getMatchFormatDisplayLabel', () => {
  it('retorna os rótulos do droplist de nova partida', () => {
    expect(getMatchFormatDisplayLabel('BEST_OF_3')).toBe('Melhor de 3 sets com vantagem');
    expect(getMatchFormatDisplayLabel('BEST_OF_3_NO_AD')).toBe('Melhor de 3 sets "no ad"');
    expect(getMatchFormatDisplayLabel('BEST_OF_3_MATCH_TB')).toBe(
      'Melhor de 3 sets com vantagem e Match Tie break (MT)'
    );
    expect(getMatchFormatDisplayLabel('SHORT_SET_2V2_NO_AD')).toBe(
      'Melhor de 3 sets "no ad" e placar inicia em 2/2 e MT'
    );
    expect(getMatchFormatDisplayLabel('PRO_SET_8')).toBe(
      'Set profissional até 8 games com vantagem'
    );
    expect(getMatchFormatDisplayLabel('MATCH_TB_10')).toBe('Match Tie break');
  });

  it('retorna o formato original caso não seja encontrado', () => {
    expect(getMatchFormatDisplayLabel('CUSTOM_FORMAT')).toBe('CUSTOM_FORMAT');
  });
});

describe('formatClubMatchScore', () => {
  it('retorna traço para scoreState nulo, indefinido ou vazio', () => {
    expect(formatClubMatchScore(null)).toBe('—');
    expect(formatClubMatchScore(undefined)).toBe('—');
    expect(formatClubMatchScore({})).toBe('—');
    expect(formatClubMatchScore({ sets: [] })).toBe('—');
  });

  it('retorna traço para partida agendada com 0x0', () => {
    expect(
      formatClubMatchScore({ sets: [{ player1: 0, player2: 0 }] }, 'BEST_OF_3', 'SCHEDULED')
    ).toBe('—');
  });

  it('formata sets normais finalizados', () => {
    const raw = {
      sets: [
        { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
        { player1: 3, player2: 6, isTiebreak: false, tiebreakScore: null },
        { player1: 6, player2: 2, isTiebreak: false, tiebreakScore: null },
      ],
    };
    expect(formatClubMatchScore(raw, 'BEST_OF_3', 'FINISHED')).toBe('6/4 3/6 6/2');
  });

  it('formata set com tiebreak regular', () => {
    const raw = {
      sets: [
        {
          player1: 7,
          player2: 6,
          isTiebreak: true,
          tiebreakScore: { player1: 7, player2: 4 },
        },
      ],
    };
    expect(formatClubMatchScore(raw, 'BEST_OF_3')).toBe('7/6(4)');
  });

  it('formata match tiebreak exibindo pontos diretos', () => {
    const raw = {
      sets: [
        { player1: 6, player2: 4, isTiebreak: false },
        { player1: 4, player2: 6, isTiebreak: false },
        {
          player1: 0,
          player2: 0,
          isTiebreak: true,
          tiebreakScore: { player1: 10, player2: 8 },
        },
      ],
    };
    expect(formatClubMatchScore(raw, 'BEST_OF_3_MATCH_TB', 'FINISHED')).toBe('6/4 4/6 10/8');
  });

  it('lida com scoreState aninhado em state: { sets: [...] }', () => {
    const raw = {
      state: {
        sets: [
          { player1: 4, player2: 2, isTiebreak: false },
          { player1: 4, player2: 1, isTiebreak: false },
        ],
      },
      history: [],
    };
    expect(formatClubMatchScore(raw, 'SHORT_SET_2V2_NO_AD')).toBe('4/2 4/1');
  });
});
