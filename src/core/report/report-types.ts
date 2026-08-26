export interface PlayerPointSummary {
  pointsWon: number;
  aces: number;
  winners: number;
  forcedErrors: number;
  unforcedErrors: number;
  doubleFaults: number;
  breakPoints: number;
  breakPointsWon: number;
}

export interface ReportSummary {
  totalPoints: number;
  player1: PlayerPointSummary;
  player2: PlayerPointSummary;
  sets: Array<{ player1: number; player2: number; isTiebreak: boolean }>;
}

export interface ReportIntegrity {
  status: 'OK' | 'LEGACY_SEQUENCE' | 'INCOMPLETE_ANNOTATION';
  pointLogCount: number;
  timelinePointCount: number;
  missingSequenceCount: number;
  pointsWithoutAnnotationDetails: number;
  warnings: string[];
}
