export type FilterKey = 'p1' | 'p2' | 'bp' | 'winners' | 'errors';

export interface FilterCriteria {
  playerWinner?: 'PLAYER_1' | 'PLAYER_2';
  breakPointsOnly?: boolean;
  winnersOnly?: boolean;
  errorsOnly?: boolean;
}