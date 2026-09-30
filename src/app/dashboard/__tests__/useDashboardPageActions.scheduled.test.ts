/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { useDashboardPageActions } from '../useDashboardPageActions';

describe('useDashboardPageActions - Partidas Agendadas e Clique sem passar por edit-score', () => {
  let mockRouter: any;
  let mockHandleResumeSuspended: any;
  let mockSetMatchToDelete: any;
  let mockSetMatchToFinish: any;
  let mockOnOpenServerModal: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter = { push: jest.fn(), replace: jest.fn() };
    mockHandleResumeSuspended = jest.fn();
    mockSetMatchToDelete = jest.fn();
    mockSetMatchToFinish = jest.fn();
    mockOnOpenServerModal = jest.fn();
  });

  it('quando a partida estiver SCHEDULED ou sem initialServerId, abre o modal de seleção de sacador', () => {
    const { result } = renderHook(() =>
      useDashboardPageActions({
        router: mockRouter,
        handleResumeSuspended: mockHandleResumeSuspended,
        setMatchToDelete: mockSetMatchToDelete,
        setMatchToFinish: mockSetMatchToFinish,
        onOpenServerModal: mockOnOpenServerModal,
      })
    );

    const scheduledMatch = {
      id: 'm-sched-1',
      player1: { id: 'p1', name: 'Alcaraz' },
      player2: { id: 'p2', name: 'Sinner' },
      state: 'SCHEDULED' as const,
      format: 'BEST_OF_3',
      initialServerId: null,
    };

    result.current.handleMatchClick(scheduledMatch);

    expect(mockOnOpenServerModal).toHaveBeenCalledWith(scheduledMatch);
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('quando a partida já estiver IN_PROGRESS e com initialServerId, vai DIRETO para /scoring SEM ?modal=edit-score', () => {
    const { result } = renderHook(() =>
      useDashboardPageActions({
        router: mockRouter,
        handleResumeSuspended: mockHandleResumeSuspended,
        setMatchToDelete: mockSetMatchToDelete,
        setMatchToFinish: mockSetMatchToFinish,
        onOpenServerModal: mockOnOpenServerModal,
      })
    );

    const inProgressMatch = {
      id: 'm-prog-1',
      player1: { id: 'p1', name: 'Alcaraz' },
      player2: { id: 'p2', name: 'Sinner' },
      state: 'IN_PROGRESS' as const,
      format: 'BEST_OF_3',
      initialServerId: 'p1',
    };

    result.current.handleMatchClick(inProgressMatch);

    expect(mockOnOpenServerModal).not.toHaveBeenCalled();
    // CRÍTICO: Não passa por ?modal=edit-score
    expect(mockRouter.push).toHaveBeenCalledWith('/match/m-prog-1/scoring');
    expect(mockRouter.push).not.toHaveBeenCalledWith(expect.stringContaining('modal=edit-score'));
  });

  it('quando a partida estiver FINISHED, vai para o relatório', () => {
    const { result } = renderHook(() =>
      useDashboardPageActions({
        router: mockRouter,
        handleResumeSuspended: mockHandleResumeSuspended,
        setMatchToDelete: mockSetMatchToDelete,
        setMatchToFinish: mockSetMatchToFinish,
        onOpenServerModal: mockOnOpenServerModal,
      })
    );

    const finishedMatch = {
      id: 'm-fin-1',
      player1: { id: 'p1', name: 'Alcaraz' },
      player2: { id: 'p2', name: 'Sinner' },
      state: 'FINISHED' as const,
      format: 'BEST_OF_3',
      initialServerId: 'p1',
    };

    result.current.handleMatchClick(finishedMatch);

    expect(mockRouter.push).toHaveBeenCalledWith('/match/m-fin-1/report');
  });

  it('quando a partida tiver sessão suspensa, chama handleResumeSuspended', () => {
    const { result } = renderHook(() =>
      useDashboardPageActions({
        router: mockRouter,
        handleResumeSuspended: mockHandleResumeSuspended,
        setMatchToDelete: mockSetMatchToDelete,
        setMatchToFinish: mockSetMatchToFinish,
        onOpenServerModal: mockOnOpenServerModal,
      })
    );

    const suspendedMatch = {
      id: 'm-susp-1',
      player1: { id: 'p1', name: 'Alcaraz' },
      player2: { id: 'p2', name: 'Sinner' },
      state: 'IN_PROGRESS' as const,
      format: 'BEST_OF_3',
      suspendedSessionId: 'sess-1',
    };

    result.current.handleMatchClick(suspendedMatch);

    expect(mockHandleResumeSuspended).toHaveBeenCalledWith(suspendedMatch);
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
