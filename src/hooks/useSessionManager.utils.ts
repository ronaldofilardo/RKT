import type { SetEditData } from "@/components/scoring/editScoreHelpers";

export function normalizeMatchTiebreakState(scoreState: any, format: string): any {
  if (!scoreState) return scoreState;
  
  const isMatchTiebreakFormat = format === 'BEST_OF_3_MATCH_TB' || format === 'MATCH_TB_10';
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

export function validateMatchTiebreakComplete(
  setResults: SetEditData[],
  format: string
): { valid: boolean; error?: string } {
  if (format !== 'BEST_OF_3_MATCH_TB') {
    return { valid: true };
  }

  const matchTiebreakIdx = setResults.length === 1 ? 0 : 2;
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
    const isMatchTiebreak = format === 'BEST_OF_3_MATCH_TB' && (i === 2 || (i === 0 && setResults.length === 1));
    
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

export function isMatchTiebreakSet(index: number, setResults: SetEditData[], format: string): boolean {
  const isLastSet = index === setResults.length - 1;
  const hasCompletedSetsBefore = setResults.slice(0, index).some(s => !s.isPartial);
  return format === 'BEST_OF_3_MATCH_TB' && isLastSet && (hasCompletedSetsBefore || setResults.length === 1);
}