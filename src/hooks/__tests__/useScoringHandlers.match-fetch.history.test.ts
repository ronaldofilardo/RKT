import { createMatchFetchService } from '../useScoringHandlers.match-fetch';
import { ScoringEngine } from '@/core/scoring/engine';

// BUG FIX (2026-09-27) — timeline "cortada" em /scoring: a rede de segurança
// que restaura previousHistory (histórico do engine em memória ANTES do
// fetch) só agia quando o servidor não mandava NENHUM array `history`
// (`!Array.isArray(scoreStateToUse?.history)`). Só que matches ainda não
// beneficiados pelo fix do servidor (restoreEngineFromMatch) podiam
// persistir um `history` que É um array, só que incompleto (ex.: só o
// último ponto) — nesse caso a condição antiga NUNCA restaurava
// previousHistory, mesmo quando ele já tinha mais pontos acumulados
// localmente. Agora comparamos os tamanhos e ficamos com o maior.
describe('createMatchFetchService — recuperação de histórico', () => {
  const config = { format: 'BEST_OF_3', player1Id: 'p1', player2Id: 'p2', initialServerId: 'p1' };

  function makeDeps(engineRef: { current: ScoringEngine | null }) {
    return {
      matchId: 'match-1',
      tokenRef: { current: 'token' },
      matchVersionRef: { current: null as number | null },
      pointSequenceRef: { current: 0 },
      engineRef,
      openRef: { current: jest.fn() },
      setMatch: jest.fn(),
      setScoreState: jest.fn(),
      setPointsHistory: jest.fn(),
      setIsLoading: jest.fn(),
      setError: jest.fn(),
    };
  }

  const historyEntry = () => ({
    stateBefore: {
      sets: [],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1',
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
      startedAt: Date.now(),
      secondServe: false,
    },
    point: { winnerId: 'p1', type: 'WINNER', isFirstServe: true, isSecondServe: false, isLet: false, serverId: 'p1', timestamp: Date.now(), rallyDetails: null, rallyLength: 0, firstFaultDetail: null },
  });

  const baseState = {
    sets: [],
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: Date.now(),
    secondServe: false,
  };

  function mockFetchReturning(serverHistory: unknown[]) {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'match-1',
            format: 'BEST_OF_3',
            version: 1,
            player1: { id: 'p1' },
            player2: { id: 'p2' },
            initialServerId: 'p1',
            scoreState: { state: baseState, history: serverHistory },
          }),
      } as unknown as Response),
    ) as jest.Mock;
  }

  it('mantém o histórico local (mais longo) quando o servidor manda um history incompleto', async () => {
    const engine = new ScoringEngine(config);
    engine.restorePointHistory([historyEntry(), historyEntry(), historyEntry()]);
    const engineRef = { current: engine };

    // Servidor só tem 1 ponto no history (bug de matches antigos/ainda não
    // corrigidos) — sem o fix, isso colapsaria o histórico local de 3 → 1.
    mockFetchReturning([historyEntry()]);

    const { fetchMatch } = createMatchFetchService(makeDeps(engineRef));
    await fetchMatch(true);

    expect(engineRef.current!.getHistoryLength()).toBe(3);
  });

  it('usa o histórico do servidor quando ele é mais completo que o local', async () => {
    const engine = new ScoringEngine(config);
    engine.restorePointHistory([historyEntry()]);
    const engineRef = { current: engine };

    mockFetchReturning([historyEntry(), historyEntry(), historyEntry(), historyEntry()]);

    const { fetchMatch } = createMatchFetchService(makeDeps(engineRef));
    await fetchMatch(true);

    expect(engineRef.current!.getHistoryLength()).toBe(4);
  });
});
