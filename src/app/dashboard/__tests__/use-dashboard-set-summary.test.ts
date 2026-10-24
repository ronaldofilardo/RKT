/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useDashboardSetSummary } from '../use-dashboard-set-summary';
import { SET_SUMMARY_POLL_INTERVAL_MS } from '../use-dashboard-set-summary-polling';
import { matchesClient } from '@/services/matchesClient';
import type { DashboardMatchPayload } from '@/components/dashboard/MatchCard';

jest.mock('@/services/matchesClient', () => ({
  matchesClient: { getReportTimeline: jest.fn() },
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), log: jest.fn() },
}));

const getReportTimeline = matchesClient.getReportTimeline as jest.Mock;

const set = (player1: number, player2: number) => ({
  player1,
  player2,
  isTiebreak: false,
  tiebreakScore: null,
});

const scoreState = (sets: ReturnType<typeof set>[], isFinished = false) => ({
  sets,
  currentGame: { player1: 0, player2: 0 },
  server: 'player1',
  isFinished,
  winner: null,
  setsWon: { player1: 0, player2: 0 },
});

const match = (overrides: Partial<DashboardMatchPayload> = {}): DashboardMatchPayload => ({
  id: 'm1',
  state: 'IN_PROGRESS',
  format: 'BEST_OF_3',
  player1: { name: 'A' },
  player2: { name: 'B' },
  // snapshot antigo da lista: set 1 ainda em andamento
  scoreState: scoreState([set(3, 2)]),
  ...overrides,
});

const flush = () => act(async () => { await Promise.resolve(); });

describe('useDashboardSetSummary', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    getReportTimeline.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('usa o scoreState do /report (e não o da lista) para placar e contagem de sets', async () => {
    getReportTimeline.mockResolvedValue({
      timelinePoints: [{ setNumber: 1 }],
      scoreState: scoreState([set(6, 4), set(2, 1)]),
      format: 'BEST_OF_3',
    });
    const { result } = renderHook(() => useDashboardSetSummary());

    await act(async () => {
      await result.current.openMatchSetSummary(match());
    });

    expect(result.current.setSummaryTimelinePoints).toHaveLength(1);
    expect(result.current.completedSetsCount).toBe(1);
    expect(result.current.completedSetsData[0]).toMatchObject({
      games: { player1: 6, player2: 4 },
      isCompleted: true,
      winner: 'player1',
    });
    expect(result.current.completedSetsData[1]).toMatchObject({ isCompleted: false, winner: null });
  });

  it('usa o scoreState da lista como fallback quando o /report falha', async () => {
    getReportTimeline.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useDashboardSetSummary());

    await act(async () => {
      await result.current.openMatchSetSummary(match());
    });

    expect(result.current.completedSetsCount).toBe(1);
    expect(result.current.completedSetsData[0].games).toEqual({ player1: 3, player2: 2 });
  });

  it('revalida periodicamente enquanto o modal está aberto em partida ao vivo', async () => {
    getReportTimeline.mockResolvedValue({ timelinePoints: [], scoreState: scoreState([set(3, 2)]) });
    const { result } = renderHook(() => useDashboardSetSummary());
    await act(async () => {
      await result.current.openMatchSetSummary(match());
    });
    expect(getReportTimeline).toHaveBeenCalledTimes(1);

    getReportTimeline.mockResolvedValue({
      timelinePoints: [],
      scoreState: scoreState([set(6, 3), set(1, 0)]),
    });
    await act(async () => {
      jest.advanceTimersByTime(SET_SUMMARY_POLL_INTERVAL_MS);
    });
    await flush();
    await flush();

    expect(getReportTimeline).toHaveBeenCalledTimes(2);
    expect(result.current.completedSetsData[0].games).toEqual({ player1: 6, player2: 3 });
  });

  it('não faz polling para partida finalizada', async () => {
    getReportTimeline.mockResolvedValue({ timelinePoints: [], scoreState: scoreState([set(6, 4)], true) });
    const { result } = renderHook(() => useDashboardSetSummary());
    await act(async () => {
      await result.current.openMatchSetSummary(match({ state: 'FINISHED' }));
    });

    await act(async () => {
      jest.advanceTimersByTime(SET_SUMMARY_POLL_INTERVAL_MS * 3);
    });

    expect(getReportTimeline).toHaveBeenCalledTimes(1);
  });

  it('para o polling ao fechar o modal', async () => {
    getReportTimeline.mockResolvedValue({ timelinePoints: [], scoreState: scoreState([set(3, 2)]) });
    const { result } = renderHook(() => useDashboardSetSummary());
    await act(async () => {
      await result.current.openMatchSetSummary(match());
    });

    act(() => {
      result.current.setSetSummaryMatch(null);
    });
    await act(async () => {
      jest.advanceTimersByTime(SET_SUMMARY_POLL_INTERVAL_MS * 3);
    });

    expect(getReportTimeline).toHaveBeenCalledTimes(1);
  });
});
