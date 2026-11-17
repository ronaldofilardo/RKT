/**
 * Split de scoring-protections.test.ts — PROTEÇÃO #1 (validação de Match
 * Tie-Break): MT completo, parcial, incompleto marcado como completo e
 * estendido 12-10. Asserções 1:1.
 */
import type { SetEditData } from '@/core/scoring/edit-score-domain';

describe('PROTEÇÃO #1: Validação Preventiva de Match Tie-Break', () => {
  it("deve permitir match tie-break completo com vitória clara", () => {
    const setResults: SetEditData[] = [
      { p1Games: 6, p2Games: 4, isPartial: false }, // Set 1
      { p1Games: 3, p2Games: 6, isPartial: false }, // Set 2
      { p1Games: 10, p2Games: 7, isPartial: false }, // Match TB completo
    ];
    const matchTiebreakIdx = 2;
    const set = setResults[matchTiebreakIdx];
    const tbMin = 10;
    const p1Won = set.p1Games >= tbMin && set.p1Games - set.p2Games >= 2;
    const p2Won = set.p2Games >= tbMin && set.p2Games - set.p1Games >= 2;
    expect(p1Won || p2Won).toBe(true);
    expect(p1Won).toBe(true); // Player 1 venceu 10-7
  });

  it("deve permitir match tie-break em andamento (parcial)", () => {
    const setResults: SetEditData[] = [
      { p1Games: 6, p2Games: 4, isPartial: false }, // Set 1
      { p1Games: 3, p2Games: 6, isPartial: false }, // Set 2
      { p1Games: 8, p2Games: 6, isPartial: true }, // Match TB em andamento
    ];
    const matchTiebreakIdx = 2;
    const set = setResults[matchTiebreakIdx];
    // Parcial é permitido mesmo sem vencedor
    expect(set.isPartial).toBe(true);
    expect(set.p1Games >= 10 || set.p2Games >= 10).toBe(false); // Ainda não chegou a 10
  });

  it("deve rejeitar match tie-break incompleto marcado como completo", () => {
    const setResults: SetEditData[] = [
      { p1Games: 6, p2Games: 4, isPartial: false }, // Set 1
      { p1Games: 3, p2Games: 6, isPartial: false }, // Set 2
      { p1Games: 10, p2Games: 9, isPartial: false }, // Match TB incompleto (diferença < 2)
    ];
    const matchTiebreakIdx = 2;
    const set = setResults[matchTiebreakIdx];
    const tbMin = 10;
    const p1Won = set.p1Games >= tbMin && set.p1Games - set.p2Games >= 2;
    const p2Won = set.p2Games >= tbMin && set.p2Games - set.p1Games >= 2;
    expect(p1Won).toBe(false); // 10-9 não tem diferença de 2
    expect(p2Won).toBe(false);
    expect(set.isPartial).toBe(false); // Marcado como completo, mas não deveria
  });

  it("deve permitir match tie-break 12-10 (diferença de 2)", () => {
    const setResults: SetEditData[] = [
      { p1Games: 6, p2Games: 4, isPartial: false },
      { p1Games: 3, p2Games: 6, isPartial: false },
      { p1Games: 12, p2Games: 10, isPartial: false }, // TB estendido válido
    ];
    const matchTiebreakIdx = 2;
    const set = setResults[matchTiebreakIdx];
    const tbMin = 10;
    const p1Won = set.p1Games >= tbMin && set.p1Games - set.p2Games >= 2;
    expect(p1Won).toBe(true); // 12-10 é válido
  });
});
