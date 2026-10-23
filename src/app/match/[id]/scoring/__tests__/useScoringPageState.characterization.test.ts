/**
 * @jest-environment jsdom
 *
 * Characterization (R-15) pré-B-10: congela o contrato público de
 * `useScoringPageState` — shape exato do return, mapeamento de
 * `gamePointToDisplay` e máquina de syncStatus (auth-required/reset)
 * alimentada pelos eventos do offline sync.
 */
import { renderHook, act } from '@testing-library/react';
import { useScoringPageState } from '../useScoringPageState';

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

const EXPECTED_KEYS = [
  'matchId', 'router', 'match', 'setMatch', 'isLoading', 'setIsLoading',
  'error', 'setError', 'scoreState', 'setScoreState', 'elapsed', 'setElapsed',
  'timerRef', 'setupLoading', 'setSetupLoading', 'fontScale', 'setFontScale',
  'pointsHistory', 'setPointsHistory', 'showFinishedBanner', 'setShowFinishedBanner',
  'serveErrorState', 'openServeErrorModal', 'closeServeErrorModal',
  'setFirstServeError', 'clearFirstServeError', 'setServeStep',
  'pointSequenceRef', 'sessionIdRef', 'suspendedSession', 'setSuspendedSession',
  'pendingEditScore', 'setPendingEdit', 'floorCurrentSets', 'setFloorCurrentSets',
  'viewMode', 'setViewMode', 'engineTick', 'setEngineTick',
  'isProcessingRef', 'debounceTimerRef', 'tokenRef', 'sessionActive', 'setSessionActive',
  'activeModal', 'modalParams', 'open', 'close', 'closeAll',
  'session', 'clearPendingEdit', 'updateScore',
  'modalParamsRef', 'openRef', 'matchIdRef', 'engineRef',
  'isOnline', 'enqueue', 'clearQueueForMatch', 'removeLastAction', 'syncPendingMatches',
  'syncStatus', 'setSyncStatus', 'toast',
  'gamePointToDisplay', 'timelinePoints', 'fetchTimelinePoints', 'fetchPointLogAudioMeta',
  'comments', 'setComments', 'fetchComments',
];

describe('useScoringPageState - characterization pré-extração (B-10)', () => {
  it('expõe exatamente o contrato de chaves do ScoringPageState', () => {
    const { result } = renderHook(() => useScoringPageState('match-1'));

    expect(Object.keys(result.current).sort()).toEqual([...EXPECTED_KEYS].sort());
    expect(EXPECTED_KEYS).toHaveLength(71);
  });

  it('gamePointToDisplay mapeia 0→"0", 1→"15", 2→"30", 3→"40", 4→"AD" e demais valores como string', () => {
    const { result } = renderHook(() => useScoringPageState('match-1'));

    expect(result.current.gamePointToDisplay(0)).toBe('0');
    expect(result.current.gamePointToDisplay(1)).toBe('15');
    expect(result.current.gamePointToDisplay(2)).toBe('30');
    expect(result.current.gamePointToDisplay(3)).toBe('40');
    expect(result.current.gamePointToDisplay(4)).toBe('AD');
    expect(result.current.gamePointToDisplay(7)).toBe('7');
  });

  it('syncStatus inicia "synced" quando online', () => {
    const { result } = renderHook(() => useScoringPageState('match-1'));

    expect(result.current.isOnline).toBe(true);
    expect(result.current.syncStatus).toBe('synced');
  });

  it('evento offline-sync-auth-required leva a "auth-required" e offline-sync-complete volta a "synced"', () => {
    const { result } = renderHook(() => useScoringPageState('match-1'));

    act(() => {
      window.dispatchEvent(new Event('offline-sync-auth-required'));
    });
    expect(result.current.syncStatus).toBe('auth-required');

    act(() => {
      window.dispatchEvent(new Event('offline-sync-complete'));
    });
    expect(result.current.syncStatus).toBe('synced');
  });

  it('refs de binding acompanham os valores atuais a cada render (modalParamsRef/openRef/matchIdRef)', () => {
    const { result } = renderHook(() => useScoringPageState('match-1'));

    expect(result.current.matchIdRef.current).toBe('match-1');
    expect(result.current.modalParamsRef.current).toEqual({});
    expect(typeof result.current.openRef.current).toBe('function');
  });
});
