import type { SetEditData } from "@/components/scoring/editScoreHelpers";
import type { TennisFormat } from "@/core/scoring/types";

export function normalizeMatchTiebreakState(scoreState: any, format: string): any {
  if (!scoreState) return scoreState;
  
  const isMatchTiebreakFormat = isMatchTiebreakFormatType(format);
  if (!isMatchTiebreakFormat) return scoreState;
  
  const result = { ...scoreState };
  
  if (result.sets?.length >= 1) {
    const setIndex = format === 'MATCH_TB_10' ? 0 : result.sets.length - 1;
    const set = result.sets[setIndex];
    
    if (set && (set.player1 > 0 || set.player2 > 0) && !set.isTiebreak && !set.tiebreakScore) {
      const newSet = {
        ...set,
        tiebreakScore: { player1: set.player1, player2: set.player2 },
        player1: 0,
        player2: 0,
        isTiebreak: true,
      };
      
      if (format === 'MATCH_TB_10') {
        result.sets = [newSet];
      } else {
        result.sets[setIndex] = newSet;
      }
    }
  }
  
  return result;
}

function isMatchTiebreakFormatType(format: string): boolean {
  return format === 'BEST_OF_3_MATCH_TB' || format === 'MATCH_TB_10' || 
         format === 'BEST_OF_5' || format === 'SHORT_SET_2V2_NO_AD';
}

export function validateMatchTiebreakComplete(
  setResults: SetEditData[],
  format: string
): { valid: boolean; error?: string } {
  // Match tie-break formats that need validation
  const isMtFormat = format === 'BEST_OF_3_MATCH_TB' || 
                     format === 'BEST_OF_5' || 
                     format === 'SHORT_SET_2V2_NO_AD' || 
                     format === 'MATCH_TB_10';
  
  if (!isMtFormat) {
    return { valid: true };
  }

  // Determine which set index is the match tie-break
  let matchTiebreakIdx: number;
  if (format === 'MATCH_TB_10') {
    matchTiebreakIdx = 0;
  } else if (format === 'BEST_OF_5') {
    matchTiebreakIdx = 4; // 5th set (0-indexed)
  } else {
    matchTiebreakIdx = 2; // 3rd set for BEST_OF_3_MATCH_TB and SHORT_SET_2V2_NO_AD
  }
  
  // Adjust for partial results array
  if (setResults.length === 1) {
    matchTiebreakIdx = 0;
  }
  
  const set = setResults[matchTiebreakIdx];

  if (!set) {
    return { valid: true };
  }

  if (set.isPartial) {
    return { valid: true };
  }

  const tbMin = 10;
  const p1Won = set.p1Games >= tbMin && set.p1Games - set.p2Games >= 2;
  const p2Won = set.p2Games >= tbMin && set.p2Games - set.p1Games >= 2;

  if (p1Won || p2Won) {
    return { valid: true };
  }

  if (set.p1Games >= tbMin || set.p2Games >= tbMin) {
    if (Math.abs(set.p1Games - set.p2Games) < 2) {
      return { valid: true };
    }
  }

  if (!set.isPartial) {
    return {
      valid: false,
      error: 'MATCH_TIEBREAK_INCOMPLETE: Match tie-break requer 10 pontos com diferença mínima de 2',
    };
  }

  return { valid: true };
}

export function calculateSetsWon(setResults: SetEditData[], format: string): { player1: number; player2: number } {
  let p1Sets = 0;
  let p2Sets = 0;
  
  for (let i = 0; i < setResults.length; i++) {
    const set = setResults[i];
    const isMatchTiebreak = isMatchTiebreakSet(i, setResults, format);
    
    if (isMatchTiebreak) {
      const p1Won = set.p1Games >= 10 && set.p1Games - set.p2Games >= 2;
      const p2Won = set.p2Games >= 10 && set.p2Games - set.p1Games >= 2;
      if (p1Won) p1Sets++;
      else if (p2Won) p2Sets++;
    } else {
      if (!set.isPartial && set.p1Games > set.p2Games) p1Sets++;
      else if (!set.isPartial && set.p2Games > set.p1Games) p2Sets++;
    }
  }
  
  return { player1: p1Sets, player2: p2Sets };
}

/**
 * Determina se um set no índice dado é um Match Tie-Break.
 * Unifica a lógica com isMatchTiebreakActive do matchConfig.ts.
 * 
 * @param index - Índice do set (0-based)
 * @param setResults - Array de resultados de sets já editados
 * @param format - Formato da partida
 * @returns true se este set deve ser um Match Tie-Break
 */
export function isMatchTiebreakSet(index: number, setResults: SetEditData[], format: string): boolean {
  const currentSetNum = index + 1; // 1-based
  
  // Contar sets já vencidos (não parciais) antes deste índice
  let p1Sets = 0;
  let p2Sets = 0;
  for (let i = 0; i < index; i++) {
    const s = setResults[i];
    // Handle both SetEditData (has isPartial) and CompletedSet (no isPartial)
    const isPartial = 'isPartial' in s ? s.isPartial : false;
    if (!isPartial) {
      if (s.p1Games > s.p2Games) p1Sets++;
      else if (s.p2Games > s.p1Games) p2Sets++;
    }
  }
  
  // MATCH_TB_10: partida inteira é match tie-break (set 1)
  if (format === 'MATCH_TB_10') {
    return currentSetNum === 1;
  }
  
  // Grand Slam (BEST_OF_5): 5º set com MT em 6/6 (quando 2x2)
  if (format === 'BEST_OF_5' && currentSetNum === 5 && p1Sets === 2 && p2Sets === 2) {
    return true;
  }
  
  // Melhor de 3 com MT (BEST_OF_3_MATCH_TB): 3º set quando 1x1
  if (format === 'BEST_OF_3_MATCH_TB' && currentSetNum === 3 && p1Sets === 1 && p2Sets === 1) {
    return true;
  }
  
  // Short set no-ad (SHORT_SET_2V2_NO_AD): 3º set quando 1x1
  if (format === 'SHORT_SET_2V2_NO_AD' && currentSetNum === 3 && p1Sets === 1 && p2Sets === 1) {
    return true;
  }
  
  return false;
}