import type { TennisFormat } from '@/core/scoring/types';

export type { TennisFormat };

export interface NormalizedScoreState {
  sets: Array<{
    player1: number;
    player2: number;
    isTiebreak?: boolean;
    tiebreakScore?: { player1: number; player2: number } | null;
  }>;
  currentGame?: {
    player1: number | string;
    player2: number | string;
    isDeuce?: boolean;
    advantage?: 'player1' | 'player2' | null;
  };
}

export function normalizeScoreState(rawScoreState: any, format?: TennisFormat): NormalizedScoreState | null {
  if (!rawScoreState) return null;

  let parsed = rawScoreState;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }

  if (parsed?.sets && format) {
    const isMatchTiebreakFormat = format === 'MATCH_TB_10' || format === 'BEST_OF_3_MATCH_TB';
    if (isMatchTiebreakFormat && parsed.sets.length >= 1) {
      const setIndex = format === 'MATCH_TB_10' ? 0 : parsed.sets.length - 1;
      const set = parsed.sets[setIndex];
      
      if (set && (set.player1 > 0 || set.player2 > 0) && !set.isTiebreak && !set.tiebreakScore) {
        parsed.sets[setIndex] = {
          ...set,
          tiebreakScore: { player1: set.player1, player2: set.player2 },
          player1: 0,
          player2: 0,
          isTiebreak: true,
        };
      }
    }
  }

  if (parsed?.sets && parsed?.currentGame) {
    return parsed;
  }

  if (parsed?.sets && Array.isArray(parsed.sets)) {
    return {
      ...parsed,
      currentGame: parsed.currentGame ?? {
        player1: 0,
        player2: 0,
        isDeuce: false,
        advantage: null,
      },
    };
  }

  if (parsed?.state && Array.isArray(parsed?.history)) {
    return parsed.state;
  }

  return null;
}

export function formatSetScore(set: {
  player1: number;
  player2: number;
  isTiebreak?: boolean;
  tiebreakScore?: { player1: number; player2: number } | null;
}): string {
  if (set.isTiebreak && set.tiebreakScore) {
    const loser = Math.min(set.tiebreakScore.player1, set.tiebreakScore.player2);
    return `${set.player1}/${set.player2}(${loser})`;
  }
  return `${set.player1}/${set.player2}`;
}

export function formatGamePoints(currentGame: {
  player1?: number | string;
  player2?: number | string;
  advantage?: 'player1' | 'player2' | null;
}): string {
  const GAME_POINTS = ['0', '15', '30', '40'] as const;
  const pts1 = currentGame.player1 ?? 0;
  const pts2 = currentGame.player2 ?? 0;
  const p1 = currentGame.advantage === 'player1'
    ? 'AD'
    : (GAME_POINTS[Math.min(typeof pts1 === 'number' ? pts1 : 0, 3)] ?? String(pts1));
  const p2 = currentGame.advantage === 'player2'
    ? 'AD'
    : (GAME_POINTS[Math.min(typeof pts2 === 'number' ? pts2 : 0, 3)] ?? String(pts2));
  return `${p1}-${p2}`;
}

export function getSinglePointDisplay(
  currentGame: { player1?: number | string; player2?: number | string; advantage?: 'player1' | 'player2' | null } | undefined,
  player: 'player1' | 'player2',
): string {
  const pts = currentGame?.[player] ?? 0;
  if (currentGame?.advantage === player) return 'AD';
  const GP = ['0', '15', '30', '40'];
  return GP[Math.min(typeof pts === 'number' ? pts : 0, 3)];
}

export function isMatchTiebreakFormat(format: string): boolean {
  return format === 'MATCH_TB_10' || format === 'BEST_OF_3_MATCH_TB';
}