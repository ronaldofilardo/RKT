export type TennisFormat =
  | "BEST_OF_3"
  | "BEST_OF_5"
  | "BEST_OF_3_MATCH_TB"
  | "SHORT_SET_2V2_NO_AD"
  | "PRO_SET_8"
  | "MATCH_TB_10"
  | "BEST_OF_3_NO_AD";

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

export const BASE_RULES: Omit<MatchFormatRules, "format" | "isMatchTiebreakFormat"> = {
  setsToWin: 1,
  gamesPerSet: 6,
  useAdvantage: true,
  useTiebreak: true,
  tiebreakAt: 6,
  tiebreakPoints: 7,
  matchTiebreakPoints: 10,
  useNoAd: false,
};
