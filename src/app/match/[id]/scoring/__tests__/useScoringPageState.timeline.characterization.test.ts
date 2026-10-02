/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useScoringPageState } from '../useScoringPageState';
import { ScoringEngine } from '@/core/scoring/engine';
import type { TimelinePoint } from '@/core/scoring/types';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/hooks/useOfflineSync', () => ({
  useOfflineSync: () => ({
    enqueue: jest.fn(),
    clearQueueForMatch: jest.fn(),
    removeLastAction: jest.fn(),
    isOnline: true,
  }),
}));

jest.mock('@/hooks/useOfflineMatchSync', () => ({
  useOfflineMatchSync: () => ({
    syncPendingMatches: jest.fn(),
  }),
}));

jest.mock('@/components/Toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('@/hooks/useModalStack', () => ({
  useModalStack: () => ({
    activeModal: null,
    modalParams: {},
    open: jest.fn(),
    close: jest.fn(),
    closeAll: jest.fn(),
  }),
}));

jest.mock('@/contexts/SessionContext', () => ({
  useSession: () => ({
    session: { pendingEditScore: null },
    clearPendingEdit: jest.fn(),
    updateScore: jest.fn(),
    setPendingEdit: jest.fn(),
  }),
}));

describe('useScoringPageState - timelinePoints memoization and edit score resilience', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('preserves timelinePoints with segmentBreak after edit-score resets engine history', async () => {
    const mockReportTimeline: TimelinePoint[] = [
      {
        pointNumber: 1,
        winner: 'PLAYER_1',
        type: 'POINT',
        server: 'player1',
        isFirstServe: true,
        isSecondServe: false,
        gameScore: { player1: 1, player2: 0 },
        gamesScore: { player1: 0, player2: 0 },
        setNumber: 1,
        isBreakPoint: false,
        isGameBall: false,
        isSetBall: false,
        rallyLength: 1,
        rallyDetails: null,
      },
      {
        pointNumber: 2,
        winner: 'PLAYER_2',
        type: 'POINT',
        server: 'player1',
        isFirstServe: true,
        isSecondServe: false,
        gameScore: { player1: 1, player2: 1 },
        gamesScore: { player1: 0, player2: 0 },
        setNumber: 1,
        isBreakPoint: false,
        isGameBall: false,
        isSetBall: false,
        rallyLength: 1,
        rallyDetails: null,
        segmentBreak: {
          editedAt: new Date().toISOString(),
          previousLabel: '0x0 (15x15)',
          newLabel: '1x0 (0x0)',
        },
      },
    ];

    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url.includes('/report')) {
        return {
          ok: true,
          json: async () => ({ timelinePoints: mockReportTimeline }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    const { result } = renderHook(() => useScoringPageState('match-1'));

    // Simula match carregado
    act(() => {
      result.current.setMatch({
        id: 'match-1',
        format: 'BEST_OF_3',
        player1: { id: 'p1', name: 'Jogador 1' },
        player2: { id: 'p2', name: 'Jogador 2' },
        initialServerId: 'p1',
      } as any);
    });

    // Sem engine em memória e sem report, lista inicia vazia
    expect(result.current.timelinePoints).toEqual([]);

    // Busca timeline com segmentos via fetchTimelinePoints
    await act(async () => {
      await result.current.fetchTimelinePoints();
    });

    // Deve conter os pontos da reconstrução com o segmentBreak preservado
    expect(result.current.timelinePoints).toHaveLength(2);
    expect(result.current.timelinePoints[1].segmentBreak).toBeDefined();

    // Memoization check: renderizações subsequentes sem alteração devem manter a mesma referência
    const firstRef = result.current.timelinePoints;
    act(() => {
      result.current.setFontScale(1.2);
    });
    expect(result.current.timelinePoints).toBe(firstRef);
  });

  it('does not duplicate timeline points when local engine history matches server points without segment breaks', async () => {
    const mockReportTimeline: TimelinePoint[] = [
      {
        pointNumber: 1,
        winner: 'PLAYER_1',
        type: 'POINT',
        server: 'player1',
        isFirstServe: true,
        isSecondServe: false,
        gameScore: { player1: 1, player2: 0 },
        gamesScore: { player1: 0, player2: 0 },
        setNumber: 1,
        isBreakPoint: false,
        isGameBall: false,
        isSetBall: false,
        rallyLength: 1,
        rallyDetails: null,
      },
      {
        pointNumber: 2,
        winner: 'PLAYER_2',
        type: 'POINT',
        server: 'player1',
        isFirstServe: true,
        isSecondServe: false,
        gameScore: { player1: 1, player2: 1 },
        gamesScore: { player1: 0, player2: 0 },
        setNumber: 1,
        isBreakPoint: false,
        isGameBall: false,
        isSetBall: false,
        rallyLength: 1,
        rallyDetails: null,
      },
    ];

    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url.includes('/report')) {
        return {
          ok: true,
          json: async () => ({ timelinePoints: mockReportTimeline }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    const { result } = renderHook(() => useScoringPageState('match-1'));

    act(() => {
      result.current.setMatch({
        id: 'match-1',
        format: 'BEST_OF_3',
        player1: { id: 'p1', name: 'Jogador 1' },
        player2: { id: 'p2', name: 'Jogador 2' },
        initialServerId: 'p1',
      } as any);
    });

    // Inicializa o engine com 2 pontos aplicados localmente
    const engine = new ScoringEngine({
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
    });
    engine.applyPoint({ winnerId: 'p1', serverId: 'p1' });
    engine.applyPoint({ winnerId: 'p2', serverId: 'p1' });

    act(() => {
      result.current.engineRef.current = engine;
      result.current.setEngineTick(1);
    });

    // Antes de buscar do servidor, timeline tem os 2 pontos locais
    expect(result.current.timelinePoints).toHaveLength(2);

    // Busca timeline do servidor (que também tem os mesmos 2 pontos, sem segmentBreak)
    await act(async () => {
      await result.current.fetchTimelinePoints();
    });

    // NÃO deve duplicar para 4 pontos! Deve conter exatamente 2 pontos.
    expect(result.current.timelinePoints).toHaveLength(2);
  });
});
