import type { MatchScoreState } from "@/schemas/match";

import type { MatchData, ValidationResult } from "./match-validator-types";

export function validateDoublesState(
  state: MatchScoreState | null,
  match: MatchData,
): ValidationResult | null {
  if (match.matchType !== "DOUBLES") return null;
  if (!state?.doubles) return null;

  const { doubles } = state;
  const p1Members = new Set([match.player1Id, match.player1PartnerId].filter(Boolean) as string[]);
  const p2Members = new Set([match.player2Id, match.player2PartnerId].filter(Boolean) as string[]);

  const p1Order = doubles.serveOrder?.player1;
  const p2Order = doubles.serveOrder?.player2;
  if (!Array.isArray(p1Order) || p1Order.length !== 2 || !Array.isArray(p2Order) || p2Order.length !== 2) {
    return { error: "INVALID_DOUBLES_STATE: serveOrder deve conter 2 jogadores para cada lado", valid: false };
  }
  if (!p1Members.has(p1Order[0]) || !p1Members.has(p1Order[1]) || p1Order[0] === p1Order[1]) {
    return { error: "INVALID_DOUBLES_STATE: serveOrder do player1 deve conter os 2 membros da dupla", valid: false };
  }
  if (!p2Members.has(p2Order[0]) || !p2Members.has(p2Order[1]) || p2Order[0] === p2Order[1]) {
    return { error: "INVALID_DOUBLES_STATE: serveOrder do player2 deve conter os 2 membros da dupla", valid: false };
  }

  const p1Idx = doubles.serveIndex?.player1;
  const p2Idx = doubles.serveIndex?.player2;
  if (p1Idx !== 0 && p1Idx !== 1) {
    return { error: "INVALID_DOUBLES_STATE: serveIndex do player1 deve ser 0 ou 1", valid: false };
  }
  if (p2Idx !== 0 && p2Idx !== 1) {
    return { error: "INVALID_DOUBLES_STATE: serveIndex do player2 deve ser 0 ou 1", valid: false };
  }

  const p1Deuce = doubles.receiveDeuce?.player1;
  const p2Deuce = doubles.receiveDeuce?.player2;
  if (!p1Members.has(p1Deuce)) {
    return { error: "INVALID_DOUBLES_STATE: receiveDeuce do player1 deve ser membro da dupla", valid: false };
  }
  if (!p2Members.has(p2Deuce)) {
    return { error: "INVALID_DOUBLES_STATE: receiveDeuce do player2 deve ser membro da dupla", valid: false };
  }

  return null;
}
