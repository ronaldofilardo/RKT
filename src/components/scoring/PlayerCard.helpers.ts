import { GAME_POINTS } from '@/core/scoring/point-utils';
type PlayerScoreState = {
  sets: Array<{ player1: number; player2: number; isTiebreak: boolean; tiebreakScore: { player1: number; player2: number } | null }>;
  currentGame: { player1: number; player2: number; isDeuce: boolean; advantage: 'player1' | 'player2' | null };
};

export function formatPlayerScore(state: PlayerScoreState | null, side: 'player1' | 'player2'): string{if(!state)return '0';const game=state.currentGame;const set=state.sets[state.sets.length-1];if(set?.isTiebreak&&set.tiebreakScore)return String(side==='player1'?set.tiebreakScore.player1:set.tiebreakScore.player2);if(game.isDeuce){if(game.advantage===side)return 'ADV';return '40';}return GAME_POINTS[game[side]]??'0';}
