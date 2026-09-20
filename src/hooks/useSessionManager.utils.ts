import type { SetEditData } from "@/components/scoring/editScoreHelpers";
import { isMatchTiebreakSetIndex as isMatchTiebreakSetIndexCanonical, type TennisFormat } from "@/lib/matchConfig";

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
         format === 'BEST_OF_5' || format === 'SHORT_SET_2V2_NO_AD' ||
         format === 'BEST_OF_3_NO_AD';
}

// Índice (0-based) do set que é disputado como Match Tie-Break (10 pontos)
// para cada formato, ou null se o formato não tem match tie-break.
function getMatchTiebreakSetIndex(format: string): number | null {
  if (format === 'MATCH_TB_10') return 0; // partida inteira é 1 match tie-break
  if (format === 'BEST_OF_5') return 4; // 5º set
  if (
    format === 'BEST_OF_3_MATCH_TB' ||
    format === 'SHORT_SET_2V2_NO_AD' ||
    format === 'BEST_OF_3_NO_AD'
  ) {
    return 2; // 3º set
  }
  return null;
}

// Conta quantos sets cada jogador venceu entre os índices [0, uptoIndex).
function countSetsWonBefore(setResults: SetEditData[], uptoIndex: number): { player1: number; player2: number } {
  let player1 = 0;
  let player2 = 0;
  for (let i = 0; i < uptoIndex; i++) {
    const s = setResults[i];
    if (!s || s.isPartial) continue;
    if (s.p1Games > s.p2Games) player1++;
    else if (s.p2Games > s.p1Games) player2++;
  }
  return { player1, player2 };
}

export function validateMatchTiebreakComplete(
  setResults: SetEditData[],
  format: string
): { valid: boolean; error?: string } {
  // Determina qual índice de set corresponde ao match tie-break (10 pontos)
  // neste formato. Formatos sem match tie-break (BEST_OF_3, PRO_SET_8, etc.)
  // nunca precisam desta validação.
  const matchTiebreakIdx = getMatchTiebreakSetIndex(format);
  if (matchTiebreakIdx === null) {
    return { valid: true };
  }

  // O set decisivo ainda não foi alcançado nesta edição (ex.: editando o
  // 2º set de uma partida Melhor de 5 — o match tie-break só existe no
  // 5º set, que ainda nem existe no array). Sets anteriores usam o
  // tie-break normal de 7 pontos, validado em outro lugar.
  if (setResults.length <= matchTiebreakIdx) {
    return { valid: true };
  }

  // Além de existir no array, o set só é de fato um match tie-break se os
  // sets anteriores realmente levaram a partida a esse ponto decisivo
  // (ex.: 2x2 em sets para o 5º set do Melhor de 5, 1x1 para o 3º set do
  // Melhor de 3 com match tie-break). Formatos MATCH_TB_10 são a partida
  // inteira, então essa checagem não se aplica.
  if (format !== 'MATCH_TB_10') {
    const setsNeededToForceDecider = matchTiebreakIdx / 2;
    const { player1, player2 } = countSetsWonBefore(setResults, matchTiebreakIdx);
    if (player1 !== setsNeededToForceDecider || player2 !== setsNeededToForceDecider) {
      return { valid: true };
    }
  }

  const set = setResults[matchTiebreakIdx];

  if (!set) {
    return { valid: true };
  }

  if (set.isPartial) {
    return { valid: true };
  }

  // Check tiebreakScore first, then fall back to p1Games/p2Games
  const tbScore = set.tiebreakScore;
  const p1Score = tbScore ? tbScore.player1 : set.p1Games;
  const p2Score = tbScore ? tbScore.player2 : set.p2Games;

  const tbMin = 10;
  const p1Won = p1Score >= tbMin && p1Score - p2Score >= 2;
  const p2Won = p2Score >= tbMin && p2Score - p1Score >= 2;

  if (p1Won || p2Won) {
    return { valid: true };
  }

  // FIX #7: MT 10-9 (ou qualquer placar >= 10 sem margem de 2) NÃO é válido
  // quando o set NÃO é parcial (jogo finalizado). Antes, retornava
  // { valid: true } para 10-9, permitindo finalizar partida com MT incompleto.
  if (!set.isPartial) {
    return {
      valid: false,
      error: 'MATCH_TIEBREAK_INCOMPLETE: Match tie-break requer 10 pontos com diferença mínima de 2',
    };
  }

  // Set parcial (em andamento): MT ainda não terminou, validar depois
  return { valid: true };
}

export function calculateSetsWon(setResults: SetEditData[], format: string): { player1: number; player2: number } {
  let p1Sets = 0;
  let p2Sets = 0;
  
  for (let i = 0; i < setResults.length; i++) {
    const set = setResults[i];
    const isMatchTiebreak = isMatchTiebreakSet(i, setResults, format);
    
    if (isMatchTiebreak) {
      if (set.isPartial) continue;
      const tbScore = set.tiebreakScore;
      const p1Score = tbScore ? tbScore.player1 : set.p1Games;
      const p2Score = tbScore ? tbScore.player2 : set.p2Games;
      
      const p1Won = p1Score >= 10 && p1Score - p2Score >= 2;
      const p2Won = p2Score >= 10 && p2Score - p1Score >= 2;
      if (p1Won) p1Sets++;
      else if (p2Won) p2Sets++;
    } else if (set.tiebreakScore) {
      if (set.isPartial) continue;
      const tb = set.tiebreakScore;
      const p1Won = tb.player1 >= 7 && tb.player1 - tb.player2 >= 2;
      const p2Won = tb.player2 >= 7 && tb.player2 - tb.player1 >= 2;
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
 * Delega à função canônica em lib/matchConfig.ts.
 * 
 * @param index - Índice do set (0-based)
 * @param setResults - Array de resultados de sets já editados
 * @param format - Formato da partida
 * @returns true se este set deve ser um Match Tie-Break
 */
export function isMatchTiebreakSet(index: number, setResults: SetEditData[], format: string): boolean {
  // Contar sets já vencidos (não parciais) antes deste índice
  let p1Sets = 0;
  let p2Sets = 0;
  for (let i = 0; i < index; i++) {
    const s = setResults[i];
    if (!s) continue;
    const isPartial = 'isPartial' in s ? s.isPartial : false;
    if (!isPartial) {
      if (s.p1Games > s.p2Games) p1Sets++;
      else if (s.p2Games > s.p1Games) p2Sets++;
    }
  }

  // Para BEST_OF_5, verificar se o set atual já tem 6-6
  const currentSet = setResults[index];
  const currentSetGames = currentSet
    ? { player1: currentSet.p1Games, player2: currentSet.p2Games }
    : undefined;

  return isMatchTiebreakSetIndexCanonical(
    index,
    { player1: p1Sets, player2: p2Sets },
    format as TennisFormat,
    currentSetGames,
  );
}