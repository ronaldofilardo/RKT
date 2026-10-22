import type { MatchScoreState, MatchScoreStateEnvelope } from "@/schemas/match";

/**
 * Aceita tanto `MatchScoreState` (plano) quanto o envelope
 * `{state, history}` enviado por `persistStateWithRetry` quando
 * `history` está disponível. Ver `useScoringHandlers.persistence.ts:73`
 * e `MatchStateInputSchema` (scoreState: union). Retorna o estado
 * plano extraído do envelope (ou o próprio input se já for plano).
 */
export function unwrapScoreState(scoreState: unknown): MatchScoreState | null {
  if (!scoreState || typeof scoreState !== "object") return null;
  const candidate = scoreState as Partial<MatchScoreStateEnvelope> &
    Partial<MatchScoreState>;
  if (candidate.state && Array.isArray(candidate.history)) {
    return candidate.state;
  }
  return scoreState as MatchScoreState;
}
