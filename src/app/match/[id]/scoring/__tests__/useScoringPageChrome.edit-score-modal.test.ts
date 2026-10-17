/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useScoringPageChrome } from '../use-scoring-page-chrome';
import type { ScoringPageState } from '../useScoringPageState';
import type { ScoringPageEffects } from '../useScoringPageEffects';
import type { ScoringPageDerived } from '../useScoringPageDerived';

function createMockState(overrides: Partial<ScoringPageState> = {}): ScoringPageState {
  return {
    match: { id: 'm-1', player1: { name: 'Player 1' }, player2: { name: 'Player 2' } } as any,
    isLoading: false,
    activeModal: null,
    setViewMode: jest.fn(),
    fetchTimelinePoints: jest.fn(),
    comments: [],
    ...overrides,
  } as any;
}

function createMockHandlers(overrides: Partial<ScoringPageEffects> = {}): ScoringPageEffects {
  return {
    fetchMatch: jest.fn(),
    ...overrides,
  } as any;
}

function createMockDerived(overrides: Partial<ScoringPageDerived> = {}): ScoringPageDerived {
  return {
    timelinePoints: [],
    effectiveScoreState: null,
    editScoreCompletedSets: [],
    serverEffectWinnerName: '',
    ...overrides,
  } as any;
}

describe('useScoringPageChrome - Inibição de Análise do Set ao Editar Placar', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    delete (window as any).location;
    window.location = { ...originalLocation, search: '' } as any;
  });

  afterEach(() => {
    window.location = originalLocation as any;
  });

  it('NÃO deve abrir Análise do Set na carga inicial mesmo quando a partida já possui sets completados', () => {
    const state = createMockState({ isLoading: true });
    const handlers = createMockHandlers();
    let derived = createMockDerived({ editScoreCompletedSets: [] });

    const { result, rerender } = renderHook(
      ({ s, d }) => useScoringPageChrome(s, handlers, d),
      { initialProps: { s: state, d: derived } }
    );

    expect(result.current.setSummaryModalState.isOpen).toBe(false);

    // Carga inicial finaliza e traz 1 set completado pré-existente
    state.isLoading = false;
    derived = createMockDerived({
      editScoreCompletedSets: [
        { games: { player1: 6, player2: 4 }, winner: 'player1' },
      ],
    });

    rerender({ s: state, d: derived });

    // Não deve abrir o modal de análise de set na carga inicial
    expect(result.current.setSummaryModalState.isOpen).toBe(false);
  });

  it('NÃO deve abrir Análise do Set quando URL contiver ?modal=edit-score', () => {
    window.location.search = '?modal=edit-score';

    const state = createMockState({ isLoading: false });
    const handlers = createMockHandlers();
    const derived = createMockDerived({
      editScoreCompletedSets: [
        { games: { player1: 6, player2: 4 }, winner: 'player1' },
      ],
    });

    const { result } = renderHook(() => useScoringPageChrome(state, handlers, derived));

    expect(result.current.setSummaryModalState.isOpen).toBe(false);
  });

  it('NÃO deve abrir Análise do Set quando state.activeModal for edit-score', () => {
    const state = createMockState({ isLoading: false, activeModal: 'edit-score' });
    const handlers = createMockHandlers();
    const derived = createMockDerived({
      editScoreCompletedSets: [
        { games: { player1: 6, player2: 4 }, winner: 'player1' },
      ],
    });

    const { result } = renderHook(() => useScoringPageChrome(state, handlers, derived));

    expect(result.current.setSummaryModalState.isOpen).toBe(false);
  });

  it('deve fechar Análise do Set se o usuário abrir o modal de editar placar', () => {
    const state = createMockState({ isLoading: false, activeModal: null });
    const handlers = createMockHandlers();
    const derived = createMockDerived({
      editScoreCompletedSets: [],
    });

    const { result, rerender } = renderHook(
      ({ s, d }) => useScoringPageChrome(s, handlers, d),
      { initialProps: { s: state, d: derived } }
    );

    // Simula usuário abrindo análise do set manualmente pelo botão
    act(() => {
      result.current.setSetSummaryModalState({ isOpen: true, setNumber: 1 });
    });
    expect(result.current.setSummaryModalState.isOpen).toBe(true);

    // Usuário abre editar placar (activeModal = 'edit-score')
    state.activeModal = 'edit-score';
    rerender({ s: state, d: derived });

    // Análise do Set deve fechar automaticamente para ir direto para a edição
    expect(result.current.setSummaryModalState.isOpen).toBe(false);
  });
});
