import type { TennisFormat } from "./match-config-types";

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

export function isMatchTiebreakFormatType(format: TennisFormat): boolean {
  return format === 'MATCH_TB_10' ||
         format === 'BEST_OF_3_MATCH_TB' ||
         format === 'SHORT_SET_2V2_NO_AD' ||
         format === 'BEST_OF_5' ||
         format === 'BEST_OF_3_NO_AD';
}
