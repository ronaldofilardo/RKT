/**
 * Regression tests for showGamePointsAtZero (bug #10, 2026-08-07).
 *
 * Reported behavior: ao ajustar o placar para um término de set (mas não o
 * término da partida), a opção "pontos do game" não aparece em 0/0 do
 * próximo set. Causa: showGamePointsAtZero dependia só de
 * completedSets.length > 0 || state.newSets.length > 0, o que falha no
 * cenário "primeiro set da partida sendo fechado agora, antes do handleAddSet
 * pushar para newSets".
 *
 * Fix: incorporar validation.isSetTrulyCompleted ao hasPreviousSets e
 * prevSetCompleted, capturando o fechamento do set em edição.
 *
 * Esta suite espelha a lógica de showGamePointsAtZero.
 */

function computeShowGamePointsAtZero(args: {
  bothFilled: boolean;
  p1Val: number;
  p2Val: number;
  newSetsLength: number;
  completedSetsLength: number;
  lastNewSetIsPartial: boolean;
  isSetTrulyCompleted: boolean;
}): boolean {
  const { bothFilled, p1Val, p2Val, newSetsLength, completedSetsLength, lastNewSetIsPartial, isSetTrulyCompleted } = args;
  const hasPreviousSets = completedSetsLength > 0 || newSetsLength > 0 || isSetTrulyCompleted;
  const isAtZero =
    !bothFilled ||
    (p1Val === 0 && p2Val === 0) ||
    isSetTrulyCompleted;
  const prevSetCompleted = newSetsLength > 0
    ? lastNewSetIsPartial === false
    : completedSetsLength > 0 || isSetTrulyCompleted;
  return hasPreviousSets && isAtZero && prevSetCompleted;
}

describe('Bug #10: showGamePointsAtZero após fechamento do set', () => {
  it('primeiro set recém-fechado (6x4), ambos preenchidos → seção aparece', () => {
    expect(computeShowGamePointsAtZero({
      bothFilled: true,
      p1Val: 6,
      p2Val: 4,
      newSetsLength: 0,
      completedSetsLength: 0,
      lastNewSetIsPartial: false,
      isSetTrulyCompleted: true,
    })).toBe(true);
  });

  it('primeiro set em editação antes do fechamento (5x3) → seção NÃO aparece', () => {
    expect(computeShowGamePointsAtZero({
      bothFilled: true,
      p1Val: 5,
      p2Val: 3,
      newSetsLength: 0,
      completedSetsLength: 0,
      lastNewSetIsPartial: false,
      isSetTrulyCompleted: false,
    })).toBe(false);
  });

  it('após handleAddSet o novo set em 0x0 → seção aparece', () => {
    expect(computeShowGamePointsAtZero({
      bothFilled: true,
      p1Val: 0,
      p2Val: 0,
      newSetsLength: 1,
      completedSetsLength: 0,
      lastNewSetIsPartial: false, // last set added is complete
      isSetTrulyCompleted: false,
    })).toBe(true);
  });

  it('segundo set em editação parcial (3x2) → esconde', () => {
    expect(computeShowGamePointsAtZero({
      bothFilled: true,
      p1Val: 3,
      p2Val: 2,
      newSetsLength: 1,
      completedSetsLength: 0,
      lastNewSetIsPartial: false,
      isSetTrulyCompleted: false,
    })).toBe(false);
  });

  it('sem nenhum set e inputs vazios (clicou Editar do nada) → seção não aparece', () => {
    expect(computeShowGamePointsAtZero({
      bothFilled: false,
      p1Val: NaN,
      p2Val: NaN,
      newSetsLength: 0,
      completedSetsLength: 0,
      lastNewSetIsPartial: false,
      isSetTrulyCompleted: false,
    })).toBe(false);
  });
});
