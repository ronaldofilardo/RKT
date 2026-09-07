import { normalizeScoreState, isMatchTiebreakSetIndex } from '../score-normalizer';

describe('Score Normalizer - Real', () => {
  it('deve manter contrato sem regressao', () => {
    expect(typeof isMatchTiebreakSetIndex).toBe('function');
  });
});

describe('normalizeScoreState - Regular Tiebreak Reconstruction', () => {
  it('reconstrói tiebreakScore de set 7-6 a partir do history', () => {
    const raw = {
      state: {
        sets: [
          { player1: 7, player2: 6, isTiebreak: false, tiebreakScore: null },
          { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
        ],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
      },
      history: [
        {
          stateBefore: {
            sets: [
              { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 7, player2: 5 } },
              { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
            ],
          },
        },
      ],
    };

    const result = normalizeScoreState(raw, 'BEST_OF_3');
    expect(result).not.toBeNull();
    expect(result!.sets[0].tiebreakScore).toEqual({ player1: 7, player2: 5 });
    expect(result!.sets[0].player1).toBe(7);
    expect(result!.sets[0].player2).toBe(6);
  });

  it('reconstrói tiebreakScore de set 6-7 a partir do history', () => {
    const raw = {
      state: {
        sets: [
          { player1: 6, player2: 7, isTiebreak: false, tiebreakScore: null },
        ],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
      },
      history: [
        {
          stateBefore: {
            sets: [
              { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 4, player2: 7 } },
            ],
          },
        },
      ],
    };

    const result = normalizeScoreState(raw);
    expect(result).not.toBeNull();
    expect(result!.sets[0].tiebreakScore).toEqual({ player1: 4, player2: 7 });
  });

  it('mantém tiebreakScore null quando não há history', () => {
    const raw = {
      sets: [
        { player1: 7, player2: 6, isTiebreak: false, tiebreakScore: null },
      ],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
    };

    const result = normalizeScoreState(raw);
    expect(result).not.toBeNull();
    expect(result!.sets[0].tiebreakScore).toBeNull();
  });

  it('mantém tiebreakScore null quando history não tem dados do set', () => {
    const raw = {
      state: {
        sets: [
          { player1: 7, player2: 6, isTiebreak: false, tiebreakScore: null },
        ],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
      },
      history: [
        {
          stateBefore: {
            sets: [
              { player1: 3, player2: 2, isTiebreak: false, tiebreakScore: null },
            ],
          },
        },
      ],
    };

    const result = normalizeScoreState(raw);
    expect(result).not.toBeNull();
    expect(result!.sets[0].tiebreakScore).toBeNull();
  });

  it('não altera set 6-6 com tiebreakScore já preenchido', () => {
    const raw = {
      sets: [
        { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 8, player2: 10 } },
      ],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
    };

    const result = normalizeScoreState(raw);
    expect(result).not.toBeNull();
    expect(result!.sets[0].tiebreakScore).toEqual({ player1: 8, player2: 10 });
  });

  it('não altera set regular sem tiebreak (ex: 6-4)', () => {
    const raw = {
      sets: [
        { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
      ],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
    };

    const result = normalizeScoreState(raw);
    expect(result).not.toBeNull();
    expect(result!.sets[0].tiebreakScore).toBeNull();
    expect(result!.sets[0].player1).toBe(6);
    expect(result!.sets[0].player2).toBe(4);
  });

  it('normaliza MT corrompido (BEST_OF_3_MATCH_TB set 3) E tiebreak regular no mesmo state', () => {
    const raw = {
      state: {
        sets: [
          { player1: 7, player2: 6, isTiebreak: false, tiebreakScore: null },
          { player1: 6, player2: 7, isTiebreak: false, tiebreakScore: null },
          { player1: 8, player2: 10, isTiebreak: false, tiebreakScore: null },
        ],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
      },
      history: [
        {
          stateBefore: {
            sets: [
              { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 7, player2: 5 } },
              { player1: 6, player2: 5, isTiebreak: false, tiebreakScore: null },
              { player1: 8, player2: 10, isTiebreak: false, tiebreakScore: null },
            ],
          },
        },
        {
          stateBefore: {
            sets: [
              { player1: 7, player2: 6, isTiebreak: false, tiebreakScore: { player1: 7, player2: 5 } },
              { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 4, player2: 7 } },
              { player1: 8, player2: 10, isTiebreak: false, tiebreakScore: null },
            ],
          },
        },
      ],
    };

    const result = normalizeScoreState(raw, 'BEST_OF_3_MATCH_TB');
    expect(result).not.toBeNull();
    // Set 0: regular tiebreak reconstruído do history
    expect(result!.sets[0].tiebreakScore).toEqual({ player1: 7, player2: 5 });
    expect(result!.sets[0].player1).toBe(7);
    expect(result!.sets[0].player2).toBe(6);
    // Set 1: regular tiebreak reconstruído do history
    expect(result!.sets[1].tiebreakScore).toEqual({ player1: 4, player2: 7 });
    expect(result!.sets[1].player1).toBe(6);
    expect(result!.sets[1].player2).toBe(7);
    // Set 2: MT corrompido normalizado (pontos viram tiebreakScore, games zeram)
    expect(result!.sets[2].isTiebreak).toBe(true);
    expect(result!.sets[2].player1).toBe(0);
    expect(result!.sets[2].player2).toBe(0);
    expect(result!.sets[2].tiebreakScore).toEqual({ player1: 8, player2: 10 });
  });

  it('reconstrói multiple sets 7-6 e 6-7 no mesmo match', () => {
    const raw = {
      state: {
        sets: [
          { player1: 7, player2: 6, isTiebreak: false, tiebreakScore: null },
          { player1: 6, player2: 7, isTiebreak: false, tiebreakScore: null },
          { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
        ],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
      },
      history: [
        {
          stateBefore: {
            sets: [
              { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 7, player2: 5 } },
              { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
              { player1: 3, player2: 2, isTiebreak: false, tiebreakScore: null },
            ],
          },
        },
        {
          stateBefore: {
            sets: [
              { player1: 7, player2: 6, isTiebreak: false, tiebreakScore: { player1: 7, player2: 5 } },
              { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 4, player2: 7 } },
              { player1: 3, player2: 2, isTiebreak: false, tiebreakScore: null },
            ],
          },
        },
      ],
    };

    const result = normalizeScoreState(raw);
    expect(result).not.toBeNull();
    expect(result!.sets[0].tiebreakScore).toEqual({ player1: 7, player2: 5 });
    expect(result!.sets[1].tiebreakScore).toEqual({ player1: 4, player2: 7 });
    expect(result!.sets[2].tiebreakScore).toBeNull();
  });

  it('funciona com history como string JSON', () => {
    const raw = JSON.stringify({
      state: {
        sets: [
          { player1: 7, player2: 6, isTiebreak: false, tiebreakScore: null },
        ],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
      },
      history: [
        {
          stateBefore: {
            sets: [
              { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 7, player2: 5 } },
            ],
          },
        },
      ],
    });

    const result = normalizeScoreState(raw);
    expect(result).not.toBeNull();
    expect(result!.sets[0].tiebreakScore).toEqual({ player1: 7, player2: 5 });
  });
});
