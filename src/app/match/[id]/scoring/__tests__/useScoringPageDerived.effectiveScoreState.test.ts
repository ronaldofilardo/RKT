/**
 * Regressão: "Editar Placar" não refletia no /scoring após confirmar.
 *
 * effectiveScoreState (useScoringPageDerived.ts) dava prioridade a
 * `pendingEditScore` / `session.pendingEditScore` sobre o `scoreState`
 * recém-persistido, mesmo depois que o modal de edição já havia sido
 * fechado. Como a limpeza desses dois snapshots pendentes depende de duas
 * fontes de estado distintas (useState local do /scoring + SessionContext)
 * ficarem sincronizadas, um placar editado podia continuar sendo mascarado
 * por um snapshot antigo.
 *
 * Este teste isola a função pura useScoringPageDerived (sem hooks internos)
 * e comprova que, assim que o modal fecha (activeModal !== 'edit-score'),
 * o placar exibido é sempre o `scoreState` atual — mesmo que os snapshots
 * pendentes ainda estejam com valores (defasados).
 */
import { useScoringPageDerived } from "../useScoringPageDerived";
import type { ScoringPageState } from "../useScoringPageState";
import type { ScoringPageHandlers } from "../useScoringPageEffects";
import type { ScoringState } from "@/core/scoring/types";

function buildScoreState(overrides: Partial<ScoringState> = {}): ScoringState {
  return {
    sets: [{ player1: 3, player2: 2, isTiebreak: false } as any],
    currentGame: { player1: 0, player2: 0 } as any,
    server: "player1",
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: Date.now(),
    secondServe: false,
    ...overrides,
  };
}

function buildState(overrides: Partial<ScoringPageState> = {}): ScoringPageState {
  const base = {
    match: { format: "BEST_OF_3", player1: { id: "p1" }, player2: { id: "p2" } } as any,
    scoreState: buildScoreState(),
    engineRef: { current: null } as any,
    activeModal: null as any,
    gamePointToDisplay: (p: number) => String(p),
    timelinePoints: [],
    suspendedSession: null,
    session: { pendingEditScore: null },
  };
  return { ...base, ...overrides } as unknown as ScoringPageState;
}

const handlers = { isProcessing: false } as unknown as ScoringPageHandlers;

describe("useScoringPageDerived - effectiveScoreState", () => {
  it("mostra o scoreState recém-editado quando o modal já fechou, mesmo com pendingEditScore local defasado", () => {
    const freshEditedScore = buildScoreState({ sets: [{ player1: 6, player2: 4, isTiebreak: false } as any] });
    const staleSnapshot = buildScoreState({ sets: [{ player1: 3, player2: 2, isTiebreak: false } as any] });

    const state = buildState({
      activeModal: null, // modal já foi fechado (handleEditScore chamou closeAll())
      scoreState: freshEditedScore,
      session: { pendingEditScore: { scoreState: staleSnapshot, floorSets: null } } as any,
    });

    const { effectiveScoreState } = useScoringPageDerived(state, handlers);

    expect(effectiveScoreState).toBe(freshEditedScore);
    expect(effectiveScoreState?.sets[0].player1).toBe(6);
  });

  it("mostra o scoreState recém-editado quando session.pendingEditScore (SessionContext) está defasado", () => {
    const freshEditedScore = buildScoreState({ sets: [{ player1: 6, player2: 4, isTiebreak: false } as any] });
    const staleSnapshot = buildScoreState({ sets: [{ player1: 3, player2: 2, isTiebreak: false } as any] });

    const state = buildState({
      activeModal: null,
      scoreState: freshEditedScore,
      session: { pendingEditScore: { scoreState: staleSnapshot, floorSets: null } } as any,
    });

    const { effectiveScoreState } = useScoringPageDerived(state, handlers);

    expect(effectiveScoreState).toBe(freshEditedScore);
    expect(effectiveScoreState?.sets[0].player1).toBe(6);
  });

  it("continua usando o pendingEditScore para pré-preencher o modal enquanto ele está aberto", () => {
    const currentScore = buildScoreState({ sets: [{ player1: 3, player2: 2, isTiebreak: false } as any] });
    const dashboardSnapshot = buildScoreState({ sets: [{ player1: 5, player2: 4, isTiebreak: false } as any] });

    const state = buildState({
      activeModal: "edit-score",
      scoreState: currentScore,
      session: { pendingEditScore: { scoreState: dashboardSnapshot, floorSets: null } } as any,
    });

    const { effectiveScoreState } = useScoringPageDerived(state, handlers);

    expect(effectiveScoreState).toBe(dashboardSnapshot);
  });
});
