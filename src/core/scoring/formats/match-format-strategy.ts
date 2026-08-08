/**
 * Strategy interface for tennis match formats.
 *
 * Each concrete strategy encapsulates ALL format-specific rules in one place
 * (single source of truth). The previous implementation spread rules across
 * 5 switches in `engine.flow.ts`, a parallel table in `lib/matchConfig.ts`, and
 * 3 helper switches in `components/scoring/editScoreHelpers.ts`. Adding a new
 * format required editing 8+ files — see `docs/adr/ADR-0003-match-format-strategy.md`.
 *
 * Most rules are pure properties (declarative). `isMatchTiebreakActive` is a
 * method because it depends on match runtime state (sets played + tiebreak flag
 * on the deciding set).
 *
 * @see docs/adr/ADR-0003-match-format-strategy.md
 */

import type { TennisFormat, ScoringState } from '../types';

export interface MatchFormatStrategy {
  readonly format: TennisFormat;
  readonly setsToWin: number;
  readonly totalSets: number;
  readonly gamesPerSet: number;
  readonly tiebreakAt: number;
  readonly tiebreakPoints: number;
  readonly matchTiebreakPoints: number;
  readonly useAdvantage: boolean;
  readonly useTiebreak: boolean;
  readonly useNoAd: boolean;
  readonly isMatchTiebreakFormat: boolean;
  readonly decidingSetTiebreakPoints?: number;

  /**
   * Returns true when the match tiebreak is active for the given state.
   * Implementations mirror the previous `engine.flow.ts:isMatchTiebreakActive`
   * semantics exactly (one path per format).
   */
  isMatchTiebreakActive(state: ScoringState): boolean;
}
