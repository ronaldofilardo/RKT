import {
  formatSetScore,
  formatGamePoints,
  getSinglePointDisplay,
  getLastSetPointDisplay,
  formatCompactSetScore,
  isMatchTiebreakFormat,
  isSetIndexMatchTiebreak,
  isCurrentSetMatchTiebreak,
  normalizeScoreState,
} from '@/components/dashboard/match-card-utils';

describe('formatSetScore', () => {
  it('formata set comum sem tiebreak', () => {
    expect(formatSetScore({ player1: 6, player2: 4 })).toBe('6/4');
  });

  it('formata set com tiebreak — mostra placar do perdedor entre parênteses', () => {
    expect(
      formatSetScore({
        player1: 7,
        player2: 6,
        isTiebreak: true,
        tiebreakScore: { player1: 7, player2: 5 },
      }),
    ).toBe('7/6(5)');
  });

  it('formata set com tiebreak invertido', () => {
    expect(
      formatSetScore({
        player1: 6,
        player2: 7,
        isTiebreak: true,
        tiebreakScore: { player1: 5, player2: 7 },
      }),
    ).toBe('6/7(5)');
  });

  it('formata set 0/0', () => {
    expect(formatSetScore({ player1: 0, player2: 0 })).toBe('0/0');
  });

  it('formata set quando isTiebreak é true mas tiebreakScore é null', () => {
    expect(
      formatSetScore({ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: null }),
    ).toBe('6/6');
  });
});

describe('formatGamePoints', () => {
  it('formata 0-0', () => {
    expect(formatGamePoints({ player1: 0, player2: 0 })).toBe('0-0');
  });

  it('formata 15-0', () => {
    expect(formatGamePoints({ player1: 1, player2: 0 })).toBe('15-0');
  });

  it('formata 30-15', () => {
    expect(formatGamePoints({ player1: 2, player2: 1 })).toBe('30-15');
  });

  it('formata 40-40', () => {
    expect(formatGamePoints({ player1: 3, player2: 3 })).toBe('40-40');
  });

  it('mostra AD quando advantage é player1', () => {
    expect(
      formatGamePoints({ player1: 3, player2: 3, advantage: 'player1' }),
    ).toBe('AD-40');
  });

  it('mostra AD quando advantage é player2', () => {
    expect(
      formatGamePoints({ player1: 3, player2: 3, advantage: 'player2' }),
    ).toBe('40-AD');
  });

  it('trata valores undefined como 0', () => {
    expect(formatGamePoints({})).toBe('0-0');
  });

  it('trata player1 como string (usa 0 como fallback)', () => {
    expect(formatGamePoints({ player1: '15', player2: 0 })).toBe('0-0');
  });

  it('limita valor numérico a 3 (índice para GAME_POINTS)', () => {
    expect(formatGamePoints({ player1: 5, player2: 0 })).toBe('40-0');
  });
});

describe('getSinglePointDisplay', () => {
  it('retorna GAME_POINTS[0] quando currentGame é undefined', () => {
    expect(getSinglePointDisplay(undefined, 'player1')).toBe('0');
  });

  it('retorna 15 para player1 com 1 ponto', () => {
    expect(
      getSinglePointDisplay({ player1: 1, player2: 0 }, 'player1'),
    ).toBe('15');
  });

  it('retorna AD quando advantage é do player', () => {
    expect(
      getSinglePointDisplay({ player1: 3, player2: 3, advantage: 'player1' }, 'player1'),
    ).toBe('AD');
  });

  it('retorna 40 quando advantage é do adversário', () => {
    expect(
      getSinglePointDisplay({ player1: 3, player2: 3, advantage: 'player2' }, 'player1'),
    ).toBe('40');
  });

  it('funciona para player2', () => {
    expect(
      getSinglePointDisplay({ player1: 0, player2: 2 }, 'player2'),
    ).toBe('30');
  });
});

describe('getLastSetPointDisplay', () => {
  it('retorna "-" quando sets é vazio', () => {
    expect(getLastSetPointDisplay([], 'player1')).toBe('-');
  });

  it('retorna "-" quando sets é undefined', () => {
    expect(getLastSetPointDisplay(undefined, 'player1')).toBe('-');
  });

  it('retorna games do último set quando não é tiebreak', () => {
    const sets = [
      { player1: 6, player2: 4 },
      { player1: 3, player2: 6 },
    ];
    expect(getLastSetPointDisplay(sets, 'player1')).toBe('3');
    expect(getLastSetPointDisplay(sets, 'player2')).toBe('6');
  });

  it('retorna pontos do tiebreak quando último set é tiebreak', () => {
    const sets = [
      { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
      { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 10, player2: 7 } },
    ];
    expect(getLastSetPointDisplay(sets, 'player1')).toBe('10');
    expect(getLastSetPointDisplay(sets, 'player2')).toBe('7');
  });
});

describe('formatCompactSetScore', () => {
  it('retorna games para set normal sem tiebreak', () => {
    expect(
      formatCompactSetScore({ player1: 6, player2: 4 }, 'player1'),
    ).toBe('6');
  });

  it('retorna games[points] quando não é decisive match tiebreak e há tiebreakScore', () => {
    expect(
      formatCompactSetScore(
        { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 3, player2: 2 } },
        'player1',
        false,
      ),
    ).toBe('6 [3]');
  });

  it('retorna apenas pontos do tiebreak quando é decisive match tiebreak e player vence', () => {
    expect(
      formatCompactSetScore(
        { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 10, player2: 8 } },
        'player1',
        true,
      ),
    ).toBe('10 [8]');
  });

  it('retorna apenas pontos quando é decisive match tiebreak e player perde', () => {
    expect(
      formatCompactSetScore(
        { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 8, player2: 10 } },
        'player1',
        true,
      ),
    ).toBe('8');
  });

  it('retorna games[points] com default false para isDecisiveMatchTiebreak', () => {
    expect(
      formatCompactSetScore(
        { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 5, player2: 4 } },
        'player1',
      ),
    ).toBe('6 [5]');
  });

  it('retorna "0" para set vazio sem tiebreak', () => {
    expect(formatCompactSetScore({ player1: 0, player2: 0 }, 'player1')).toBe('0');
  });
});

describe('isMatchTiebreakFormat', () => {
  it('reconhece MATCH_TB_10', () => {
    expect(isMatchTiebreakFormat('MATCH_TB_10')).toBe(true);
  });

  it('reconhece BEST_OF_3_MATCH_TB', () => {
    expect(isMatchTiebreakFormat('BEST_OF_3_MATCH_TB')).toBe(true);
  });

  it('reconhece BEST_OF_5', () => {
    expect(isMatchTiebreakFormat('BEST_OF_5')).toBe(true);
  });

  it('reconhece BEST_OF_3_NO_AD', () => {
    expect(isMatchTiebreakFormat('BEST_OF_3_NO_AD')).toBe(true);
  });

  it('reconhece SHORT_SET_2V2_NO_AD', () => {
    expect(isMatchTiebreakFormat('SHORT_SET_2V2_NO_AD')).toBe(true);
  });

  it('rejeita BEST_OF_3', () => {
    expect(isMatchTiebreakFormat('BEST_OF_3')).toBe(false);
  });

  it('rejeita string vazia', () => {
    expect(isMatchTiebreakFormat('')).toBe(false);
  });
});

describe('isSetIndexMatchTiebreak', () => {
  it('retorna false para formato não-MT', () => {
    const sets = [{ player1: 6, player2: 4 }];
    expect(isSetIndexMatchTiebreak(sets, 0, 'BEST_OF_3')).toBe(false);
  });

  it('retorna true para MATCH_TB_10 no índice 0', () => {
    const sets = [{ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 3, player2: 2 } }];
    expect(isSetIndexMatchTiebreak(sets, 0, 'MATCH_TB_10')).toBe(true);
  });

  it('retorna false para BEST_OF_5 no índice 0 (primeiro set não é MT)', () => {
    const sets = [{ player1: 6, player2: 4 }];
    expect(isSetIndexMatchTiebreak(sets, 0, 'BEST_OF_5')).toBe(false);
  });

  it('retorna true para BEST_OF_5 no índice 4 com 4 sets anteriores 2-2', () => {
    const sets = [
      { player1: 6, player2: 4 },
      { player1: 4, player2: 6 },
      { player1: 6, player2: 4 },
      { player1: 4, player2: 6 },
      { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 3, player2: 2 } },
    ];
    expect(isSetIndexMatchTiebreak(sets, 4, 'BEST_OF_5')).toBe(true);
  });

  it('retorna false para BEST_OF_3_MATCH_TB no índice 0', () => {
    const sets = [{ player1: 6, player2: 4 }];
    expect(isSetIndexMatchTiebreak(sets, 0, 'BEST_OF_3_MATCH_TB')).toBe(false);
  });

  it('retorna true para BEST_OF_3_MATCH_TB no índice 2 com 2 sets anteriores 1-1', () => {
    const sets = [
      { player1: 6, player2: 4 },
      { player1: 4, player2: 6 },
      { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 5, player2: 3 } },
    ];
    expect(isSetIndexMatchTiebreak(sets, 2, 'BEST_OF_3_MATCH_TB')).toBe(true);
  });
});

describe('isCurrentSetMatchTiebreak', () => {
  it('retorna false para sets vazios', () => {
    expect(isCurrentSetMatchTiebreak([], 'BEST_OF_5')).toBe(false);
  });

  it('retorna false para BEST_OF_3 (não é MT)', () => {
    const sets = [{ player1: 6, player2: 4 }];
    expect(isCurrentSetMatchTiebreak(sets, 'BEST_OF_3')).toBe(false);
  });

  it('retorna true para BEST_OF_5 com sets 2-2 e 5º set em tiebreak', () => {
    const sets = [
      { player1: 6, player2: 4 },
      { player1: 4, player2: 6 },
      { player1: 6, player2: 4 },
      { player1: 4, player2: 6 },
      { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 3, player2: 2 } },
    ];
    expect(isCurrentSetMatchTiebreak(sets, 'BEST_OF_5')).toBe(true);
  });

  it('retorna false para BEST_OF_5 com 1 set', () => {
    const sets = [{ player1: 3, player2: 2 }];
    expect(isCurrentSetMatchTiebreak(sets, 'BEST_OF_5')).toBe(false);
  });
});

describe('normalizeScoreState', () => {
  it('retorna null para null', () => {
    expect(normalizeScoreState(null)).toBeNull();
  });

  it('retorna null para undefined', () => {
    expect(normalizeScoreState(undefined)).toBeNull();
  });

  it('normaliza scoreState válido', () => {
    const raw = {
      sets: [{ player1: 6, player2: 4 }],
      currentGame: { player1: 0, player2: 0 },
    };
    const result = normalizeScoreState(raw);
    expect(result).not.toBeNull();
    expect(result!.sets).toEqual([{ player1: 6, player2: 4 }]);
  });
});
