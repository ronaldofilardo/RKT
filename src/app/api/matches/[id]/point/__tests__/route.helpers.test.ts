import { restoreEngineFromMatch } from '../route.helpers';

// BUG FIX (2026-09-27) — CRÍTICO: restoreEngineFromMatch() passava o
// scoreState por normalizeScoreState(), que sempre retorna só o `state`
// saneado (nunca o `history`), mesmo quando o scoreState de entrada já era
// o envelope completo {state, history}. Como esta função constrói o engine
// usado em TODA transação real de ponto (POST /point), o engine sempre
// nascia com histórico VAZIO — cada ponto marcado persistia de volta no
// banco um `history` com só ESSE ÚNICO ponto, nunca acumulando o histórico
// completo da partida. Isso não corrompia o placar (que depende só do
// `state`), mas corrompia a timeline ao vivo em /scoring (alimentada por
// engineRef.current.getPointHistory() no cliente, reidratado a partir do
// scoreState persistido), que podia exibir só o último ponto até um novo
// ponto local reconstruir o resto.
describe('restoreEngineFromMatch', () => {
  const baseMatch = {
    format: 'BEST_OF_3',
    player1Id: 'p1',
    player2Id: 'p2',
    initialServerId: 'p1',
  };

  const historyEntry = (p1: number, p2: number) => ({
    stateBefore: {
      sets: [],
      currentGame: { player1: p1, player2: p2, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1',
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
      startedAt: Date.now(),
      secondServe: false,
    },
    point: { winnerId: 'p1', type: 'WINNER', isFirstServe: true, isSecondServe: false, isLet: false, serverId: 'p1', timestamp: Date.now(), rallyDetails: null, rallyLength: 0, firstFaultDetail: null },
  });

  it('restaura o histórico completo de um scoreState em formato de envelope {state, history}', () => {
    const scoreState = {
      state: {
        sets: [],
        currentGame: { player1: 3, player2: 1, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
        startedAt: Date.now(),
        secondServe: false,
      },
      history: [historyEntry(0, 0), historyEntry(1, 0), historyEntry(2, 0), historyEntry(2, 1)],
    };

    const engine = restoreEngineFromMatch({ ...baseMatch, scoreState });

    // Antes do fix: engine.getHistoryLength() === 0 (history sempre
    // descartado por normalizeScoreState). Agora deve preservar as 4
    // entradas originais.
    expect(engine.getHistoryLength()).toBe(4);
  });

  it('não altera o comportamento quando o scoreState já não tem history (partida recém-criada)', () => {
    const scoreState = {
      sets: [],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1',
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
      startedAt: Date.now(),
      secondServe: false,
    };

    const engine = restoreEngineFromMatch({ ...baseMatch, scoreState });

    expect(engine.getHistoryLength()).toBe(0);
  });

  it('preserva o placar (state) corretamente saneado mesmo restaurando o histórico', () => {
    const scoreState = {
      state: {
        sets: [],
        currentGame: { player1: 2, player2: 3, isDeuce: false, advantage: null, secondServe: false },
        server: 'player2',
        isFinished: false,
        winner: null,
        setsWon: { player1: 0, player2: 0 },
        startedAt: Date.now(),
        secondServe: false,
      },
      history: [historyEntry(0, 0), historyEntry(1, 1)],
    };

    const engine = restoreEngineFromMatch({ ...baseMatch, scoreState });

    expect(engine.getHistoryLength()).toBe(2);
    expect(engine.getState().currentGame).toEqual(
      expect.objectContaining({ player1: 2, player2: 3 }),
    );
  });
});
