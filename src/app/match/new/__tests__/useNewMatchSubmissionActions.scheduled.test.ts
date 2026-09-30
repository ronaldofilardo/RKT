/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useNewMatchSubmissionActions } from '../useNewMatchSubmissionActions';
import { submitOnlineMatch } from '../online-match-submit.helpers';
import { saveOfflineIfNeeded } from '../offline-match.helpers';

jest.mock('../online-match-submit.helpers', () => ({
  submitOnlineMatch: jest.fn(),
}));

jest.mock('../offline-match.helpers', () => ({
  saveOfflineIfNeeded: jest.fn().mockResolvedValue(false),
}));

describe('useNewMatchSubmissionActions - Partidas Agendadas vs Imediatas', () => {
  let mockState: any;
  let mockRouter: any;
  let mockToast: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter = { push: jest.fn() };
    mockToast = jest.fn();

    mockState = {
      sportType: 'TENNIS',
      format: 'BEST_OF_3',
      courtType: 'CLAY',
      selectedP1: { id: 'p1', name: 'Alcaraz' },
      selectedP2: { id: 'p2', name: 'Sinner' },
      date: '2026-10-15', // Futura
      time: '14:00',
      submittingRef: { current: false },
      setError: jest.fn(),
      setMissingFields: jest.fn(),
      setLoading: jest.fn(),
      setCreatedMatchId: jest.fn(),
      setShowServerModal: jest.fn(),
      setDuplicateInfo: jest.fn(),
      setPendingPayload: jest.fn(),
      setShowDuplicateModal: jest.fn(),
    };

    (submitOnlineMatch as jest.Mock).mockResolvedValue({
      duplicate: false,
      data: { data: { id: 'match-scheduled-1' } },
    });
  });

  it('quando a partida for agendada para data futura, NÃO abre o modal de sacador e redireciona para o dashboard', async () => {
    mockState.date = '2099-12-31';
    mockState.time = '10:00';

    const { result } = renderHook(() =>
      useNewMatchSubmissionActions(mockState, mockRouter, mockToast)
    );

    const fakeEvent = { preventDefault: jest.fn() } as any;
    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(mockState.setShowServerModal).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith({
      type: 'success',
      message: 'Partida agendada com sucesso!',
    });
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });

  it('quando a partida for para hoje com mais de 5 minutos da hora atual, NÃO abre modal de sacador e vai para dashboard', async () => {
    const now = new Date();
    // 30 minutos no futuro
    const futureTime = new Date(now.getTime() + 30 * 60 * 1000);
    const yyyy = futureTime.getFullYear();
    const mm = String(futureTime.getMonth() + 1).padStart(2, '0');
    const dd = String(futureTime.getDate()).padStart(2, '0');
    const hh = String(futureTime.getHours()).padStart(2, '0');
    const min = String(futureTime.getMinutes()).padStart(2, '0');

    mockState.date = `${yyyy}-${mm}-${dd}`;
    mockState.time = `${hh}:${min}`;

    const { result } = renderHook(() =>
      useNewMatchSubmissionActions(mockState, mockRouter, mockToast)
    );

    const fakeEvent = { preventDefault: jest.fn() } as any;
    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(mockState.setShowServerModal).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith({
      type: 'success',
      message: 'Partida agendada com sucesso!',
    });
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });

  it('quando a partida for imediata (mesmo horário atual), abre o modal de escolha do sacador', async () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');

    mockState.date = `${yyyy}-${mm}-${dd}`;
    mockState.time = `${hh}:${min}`;

    const { result } = renderHook(() =>
      useNewMatchSubmissionActions(mockState, mockRouter, mockToast)
    );

    const fakeEvent = { preventDefault: jest.fn() } as any;
    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(mockState.setCreatedMatchId).toHaveBeenCalledWith('match-scheduled-1');
    expect(mockState.setShowServerModal).toHaveBeenCalledWith(true);
    expect(mockToast).toHaveBeenCalledWith({
      type: 'success',
      message: 'Partida criada! Escolha o primeiro sacador.',
    });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
