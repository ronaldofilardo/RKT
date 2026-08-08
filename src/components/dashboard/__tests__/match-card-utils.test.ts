import { isCurrentSetMatchTiebreak, isMatchTiebreakFormat } from "@/components/dashboard/match-card-utils";

describe("isCurrentSetMatchTiebreak", () => {
  it("retorna false para sets vazios", () => {
    expect(isCurrentSetMatchTiebreak([], "BEST_OF_5")).toBe(false);
  });

  it("retorna false para formato BEST_OF_3 (não é MT)", () => {
    const sets = [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }];
    expect(isCurrentSetMatchTiebreak(sets, "BEST_OF_3")).toBe(false);
  });

  it("retorna true para BEST_OF_5 com 4 sets 2-2 e 5º set em tiebreak", () => {
    const sets = [
      { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
      { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
      { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
      { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
      { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 3, player2: 2 } },
    ];
    expect(isCurrentSetMatchTiebreak(sets, "BEST_OF_5")).toBe(true);
  });

  it("retorna false para BEST_OF_5 com 1 set (não é set decisivo)", () => {
    const sets = [{ player1: 3, player2: 2, isTiebreak: false, tiebreakScore: null }];
    expect(isCurrentSetMatchTiebreak(sets, "BEST_OF_5")).toBe(false);
  });

  it("retorna false para BEST_OF_5 com 4 sets 3-1 (não está 2-2)", () => {
    const sets = [
      { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
      { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
      { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
      { player1: 3, player2: 2, isTiebreak: false, tiebreakScore: null },
    ];
    expect(isCurrentSetMatchTiebreak(sets, "BEST_OF_5")).toBe(false);
  });

  it("retorna true para BEST_OF_3_MATCH_TB com 2 sets 1-1 e 3º set em tiebreak", () => {
    const sets = [
      { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
      { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
      { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 5, player2: 3 } },
    ];
    expect(isCurrentSetMatchTiebreak(sets, "BEST_OF_3_MATCH_TB")).toBe(true);
  });

  it("retorna false para BEST_OF_3_MATCH_TB com 1 set (não está 1-1)", () => {
    const sets = [
      { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
    ];
    expect(isCurrentSetMatchTiebreak(sets, "BEST_OF_3_MATCH_TB")).toBe(false);
  });

  it("retorna true para MATCH_TB_10 sempre (1º set é MT)", () => {
    const sets = [
      { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 3, player2: 2 } },
    ];
    expect(isCurrentSetMatchTiebreak(sets, "MATCH_TB_10")).toBe(true);
  });

  it("retorna true para BEST_OF_3_NO_AD com 2 sets 1-1 e 3º set em tiebreak", () => {
    const sets = [
      { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
      { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
      { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 4, player2: 6 } },
    ];
    expect(isCurrentSetMatchTiebreak(sets, "BEST_OF_3_NO_AD")).toBe(true);
  });

  it("retorna true para SHORT_SET_2V2_NO_AD com 2 sets 1-1 e 3º set em tiebreak", () => {
    const sets = [
      { player1: 4, player2: 2, isTiebreak: false, tiebreakScore: null },
      { player1: 2, player2: 4, isTiebreak: false, tiebreakScore: null },
      { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 5, player2: 3 } },
    ];
    expect(isCurrentSetMatchTiebreak(sets, "SHORT_SET_2V2_NO_AD")).toBe(true);
  });
});

describe("isMatchTiebreakFormat", () => {
  it("reconhece todos os formatos MT", () => {
    expect(isMatchTiebreakFormat("MATCH_TB_10")).toBe(true);
    expect(isMatchTiebreakFormat("BEST_OF_3_MATCH_TB")).toBe(true);
    expect(isMatchTiebreakFormat("BEST_OF_5")).toBe(true);
    expect(isMatchTiebreakFormat("BEST_OF_3_NO_AD")).toBe(true);
    expect(isMatchTiebreakFormat("SHORT_SET_2V2_NO_AD")).toBe(true);
  });

  it("rejeita formatos que não são MT", () => {
    expect(isMatchTiebreakFormat("BEST_OF_3")).toBe(false);
    expect(isMatchTiebreakFormat("PRO_SET_8")).toBe(false);
    expect(isMatchTiebreakFormat("UNKNOWN")).toBe(false);
  });
});
