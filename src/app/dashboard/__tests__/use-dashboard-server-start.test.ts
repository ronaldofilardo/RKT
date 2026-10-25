/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useDashboardServerStart } from '../use-dashboard-server-start';
import { matchesClient } from '@/services/matchesClient';
import type { DashboardMatchPayload } from '@/components/dashboard/MatchCard';

jest.mock('@/services/matchesClient', () => ({
  matchesClient: {
    startMatch: jest.fn(),
  },
}));

jest.mock('@/components/Toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

describe('useDashboardServerStart', () => {
  const router = { push: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inicia partida agendada de simples sem enviar doublesSetup null no payload', async () => {
    (matchesClient.startMatch as jest.Mock).mockResolvedValueOnce({});

    const { result } = renderHook(() => useDashboardServerStart(router));

    const scheduledMatch: DashboardMatchPayload = {
      id: 'match-scheduled-1',
      state: 'SCHEDULED',
      format: 'BEST_OF_3',
      player1: { id: 'p1', name: 'Atleta 1' },
      player2: { id: 'p2', name: 'Atleta 2' },
      doublesSetup: null,
    };

    act(() => {
      result.current.setSelectedMatchForServer(scheduledMatch);
    });

    await act(async () => {
      await result.current.selectServingPlayer('p1');
    });

    expect(matchesClient.startMatch).toHaveBeenCalledWith('match-scheduled-1', {
      state: 'IN_PROGRESS',
      initialServerId: 'p1',
    });
    expect(router.push).toHaveBeenCalledWith('/match/match-scheduled-1/scoring');
  });

  it('inicia partida de duplas repassando doublesSetup quando fornecido', async () => {
    (matchesClient.startMatch as jest.Mock).mockResolvedValueOnce({});

    const { result } = renderHook(() => useDashboardServerStart(router));

    const doublesMatch: DashboardMatchPayload = {
      id: 'match-doubles-1',
      state: 'SCHEDULED',
      format: 'BEST_OF_3',
      matchType: 'DOUBLES',
      player1: { id: 'p1', name: 'Atleta 1' },
      player2: { id: 'p2', name: 'Atleta 2' },
      doublesSetup: null,
    };

    const setup = {
      serveOrder: { player1: ['p1', 'p1b'], player2: ['p2', 'p2b'] },
      receiveDeuce: { player1: 'p1', player2: 'p2' },
    } as any;

    act(() => {
      result.current.setSelectedMatchForServer(doublesMatch);
    });

    await act(async () => {
      await result.current.selectServingPlayer('p1', setup);
    });

    expect(matchesClient.startMatch).toHaveBeenCalledWith('match-doubles-1', {
      state: 'IN_PROGRESS',
      initialServerId: 'p1',
      doublesSetup: setup,
    });
    expect(router.push).toHaveBeenCalledWith('/match/match-doubles-1/scoring');
  });
});
