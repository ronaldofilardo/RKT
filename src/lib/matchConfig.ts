import type { MatchFormatRules, TennisFormat } from "./match-config-types";
import { BASE_RULES } from "./match-config-types";
import { FORMAT_DEFINITIONS } from "./match-config-formats.data";
import { isMatchTiebreakFormatType } from "./match-config-tiebreak.logic";

export type { TennisFormat, MatchFormatRules } from "./match-config-types";
export { isMatchTiebreakActive, isMatchTiebreakSetIndex } from "./match-config-tiebreak.logic";

export function getMatchFormatRules(format: TennisFormat): MatchFormatRules {
  const definition = FORMAT_DEFINITIONS[format];
  if (!definition) {
    throw new Error(`Formato de partida não suportado: ${format}`);
  }

  return {
    format,
    ...BASE_RULES,
    ...definition,
    isMatchTiebreakFormat: isMatchTiebreakFormatType(format),
  };
}

export function validateSetScore(
  p1: number,
  p2: number,
  rules: MatchFormatRules,
): {
  complete: boolean;
  inTiebreak: boolean;
  winner?: "PLAYER_1" | "PLAYER_2";
  isTiebreak?: boolean;
} {
  if (rules.gamesPerSet === 0) {
    return { complete: false, inTiebreak: false };
  }

  if (!Number.isInteger(p1) || !Number.isInteger(p2) || p1 < 0 || p2 < 0) {
    return { complete: false, inTiebreak: false };
  }

  const max = Math.max(p1, p2);
  const min = Math.min(p1, p2);
  const winner: "PLAYER_1" | "PLAYER_2" = p1 >= p2 ? "PLAYER_1" : "PLAYER_2";
  const g = rules.gamesPerSet;
  const tb = rules.tiebreakAt;

  if (max >= g && max - min >= 2) {
    return { complete: true, inTiebreak: false, winner, isTiebreak: false };
  }

  if (rules.useTiebreak && tb > 0 && max === tb + 1 && min === tb) {
    return { complete: true, inTiebreak: false, winner, isTiebreak: true };
  }

  const inTiebreak = !!(rules.useTiebreak && tb > 0 && p1 === tb && p2 === tb);
  return { complete: false, inTiebreak };
}

/** Convenience wrapper — returns true if the given set score is complete for the given format rules. */

