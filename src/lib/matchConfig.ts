export type TennisFormat =
  | "BEST_OF_3"
  | "BEST_OF_5"
  | "BEST_OF_3_MATCH_TB"
  | "BEST_OF_3_NO_AD"
  | "SHORT_SET_2V2_NO_AD"
  | "PRO_SET_8"
  | "MATCH_TB_10";

export interface MatchFormatRules {
  format: TennisFormat;
  setsToWin: number;
  gamesPerSet: number;
  useAdvantage: boolean;
  useTiebreak: boolean;
  tiebreakAt: number;
  tiebreakPoints: number;
  matchTiebreakPoints: number;
  useNoAd: boolean;
  isMatchTiebreakFormat: boolean;
  decidingSetTiebreakPoints?: number;
}

const BASE_RULES: Omit<MatchFormatRules, "format" | "isMatchTiebreakFormat"> = {
  setsToWin: 1,
  gamesPerSet: 6,
  useAdvantage: true,
  useTiebreak: true,
  tiebreakAt: 6,
  tiebreakPoints: 7,
  matchTiebreakPoints: 10,
  useNoAd: false,
};

const FORMAT_DEFINITIONS: Record<
  TennisFormat,
  Omit<MatchFormatRules, "format" | "isMatchTiebreakFormat">
> = {
  BEST_OF_3: {
    setsToWin: 2,
    gamesPerSet: 6,
    useAdvantage: true,
    useTiebreak: true,
    tiebreakAt: 6,
    tiebreakPoints: 7,
    matchTiebreakPoints: 10,
    useNoAd: false,
  },
  BEST_OF_3_MATCH_TB: {
    setsToWin: 2,
    gamesPerSet: 6,
    useAdvantage: true,
    useTiebreak: true,
    tiebreakAt: 6,
    tiebreakPoints: 7,
    matchTiebreakPoints: 10,
    useNoAd: false,
  },
  BEST_OF_3_NO_AD: {
    setsToWin: 2,
    gamesPerSet: 6,
    useAdvantage: false,
    useTiebreak: true,
    tiebreakAt: 6,
    tiebreakPoints: 7,
    matchTiebreakPoints: 10,
    useNoAd: true,
  },
  BEST_OF_5: {
    setsToWin: 3,
    gamesPerSet: 6,
    useAdvantage: true,
    useTiebreak: true,
    tiebreakAt: 6,
    tiebreakPoints: 7,
    matchTiebreakPoints: 10,
    useNoAd: false,
    decidingSetTiebreakPoints: 10,
  },
  SHORT_SET_2V2_NO_AD: {
    setsToWin: 2,
    gamesPerSet: 4,
    useAdvantage: false,
    useTiebreak: true,
    tiebreakAt: 4,
    tiebreakPoints: 7,
    matchTiebreakPoints: 10,
    useNoAd: true,
  },
  PRO_SET_8: {
    setsToWin: 1,
    gamesPerSet: 8,
    useAdvantage: true,
    useTiebreak: true,
    tiebreakAt: 8,
    tiebreakPoints: 7,
    matchTiebreakPoints: 10,
    useNoAd: false,
  },
  MATCH_TB_10: {
    setsToWin: 1,
    gamesPerSet: 0,
    useAdvantage: false,
    useTiebreak: false,
    tiebreakAt: 0,
    tiebreakPoints: 10,
    matchTiebreakPoints: 10,
    useNoAd: false,
  },
};

export function getMatchFormatRules(format: TennisFormat): MatchFormatRules {
  const definition = FORMAT_DEFINITIONS[format];
  if (!definition) {
    throw new Error(`Formato de partida não suportado: ${format}`);
  }

  return {
    format,
    ...BASE_RULES,
    ...definition,
    isMatchTiebreakFormat: format === "MATCH_TB_10",
  };
}

export function isMatchTiebreakActive(
  format: TennisFormat,
  currentSetNum: number,
  p1Sets: number,
  p2Sets: number,
): boolean {
  const matchTbFormats: TennisFormat[] = [
    "BEST_OF_3_MATCH_TB",
    "BEST_OF_3_NO_AD",
    "SHORT_SET_2V2_NO_AD",
  ];
  const isSet3MatchTb =
    matchTbFormats.includes(format) &&
    currentSetNum === 3 &&
    p1Sets === 1 &&
    p2Sets === 1;
  return format === "MATCH_TB_10" || isSet3MatchTb;
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
export function isSetCompleteForFormat(
  set: { player1: number; player2: number },
  rules: MatchFormatRules,
): boolean {
  return validateSetScore(set.player1, set.player2, rules).complete;
}
