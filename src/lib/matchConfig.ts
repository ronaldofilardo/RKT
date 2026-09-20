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
  PRO_SET_8: {
    setsToWin: 1,
    gamesPerSet: 8,
    useAdvantage: true,
    useTiebreak: true,
    tiebreakAt: 9,
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
    isMatchTiebreakFormat: isMatchTiebreakFormatType(format),
  };
}

export function isMatchTiebreakActive(
  format: TennisFormat,
  currentSetNum: number,
  p1Sets: number,
  p2Sets: number,
): boolean {
  if (format === 'MATCH_TB_10') return true;
  
  // Grand Slam: 5º set — MT em 6/6 (verificação adicional no engine pela flag isTiebreak)
  if (format === 'BEST_OF_5' && currentSetNum === 5 && p1Sets === 2 && p2Sets === 2) {
    return true;
  }
  
  // Melhor de 3 com MT: 3º set quando 1x1
  if ((format === 'BEST_OF_3_MATCH_TB' || format === 'SHORT_SET_2V2_NO_AD' || format === 'BEST_OF_3_NO_AD') && 
      currentSetNum === 3 && p1Sets === 1 && p2Sets === 1) {
    return true;
  }
  
  return false;
}

/**
 * Função canônica para determinar se um set é Match Tiebreak.
 * Unifica a lógica espalhada por scoringHelpers.ts, score-normalizer.ts,
 * useSessionManager.utils.ts e matchConfig.ts.
 * 
 * @param setIndex - Índice do set (0-based)
 * @param setsWon - { player1: number, player2: number } - sets já vencidos ANTES deste índice
 * @param format - Formato da partida
 * @param currentSetGames - Games do set atual (opcional, para verificar 6-6 no BEST_OF_5)
 * @returns true se este set deve ser um Match Tiebreak
 */
export function isMatchTiebreakSetIndex(
  setIndex: number,
  setsWon: { player1: number; player2: number },
  format: TennisFormat,
  currentSetGames?: { player1: number; player2: number },
): boolean {
  const setNum = setIndex + 1; // Converter para 1-based

  // MATCH_TB_10: partida inteira é match tie-break (set 1)
  if (format === 'MATCH_TB_10') return setNum === 1;

  // BEST_OF_5: 5º set é MT apenas quando placar está 2x2
  // Nota: para BEST_OF_5, o MT só é ativado quando ambos chegaram a 6 games (6-6)
  if (format === 'BEST_OF_5' && setNum === 5) {
    if (setsWon.player1 !== 2 || setsWon.player2 !== 2) return false;
    // Se currentSetGames foi fornecido, verificar se está 6-6
    if (currentSetGames) {
      return currentSetGames.player1 === 6 && currentSetGames.player2 === 6;
    }
    // Sem informação de games, assumir que é MT (confia no caller)
    return true;
  }

  // BEST_OF_3_MATCH_TB, SHORT_SET_2V2_NO_AD, BEST_OF_3_NO_AD: 3º set quando 1x1
  if (
    (format === 'BEST_OF_3_MATCH_TB' ||
      format === 'SHORT_SET_2V2_NO_AD' ||
      format === 'BEST_OF_3_NO_AD') &&
    setNum === 3
  ) {
    return setsWon.player1 === 1 && setsWon.player2 === 1;
  }

  return false;
}

function isMatchTiebreakFormatType(format: TennisFormat): boolean {
  return format === 'MATCH_TB_10' || 
         format === 'BEST_OF_3_MATCH_TB' || 
         format === 'SHORT_SET_2V2_NO_AD' ||
         format === 'BEST_OF_5' ||
         format === 'BEST_OF_3_NO_AD';
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
