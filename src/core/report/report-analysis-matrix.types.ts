export interface BaselineStats {
  winners: number;
  unforcedErrors: number;
  forcedErrors: number;
  total: number;
  successPct: number;
  shortRallyWon: number;
  shortRallyTotal: number;
  mediumRallyWon: number;
  mediumRallyTotal: number;
  longRallyWon: number;
  longRallyTotal: number;
}

export interface NetPassStats {
  netApproaches: number;
  netApproachesWon: number;
  netApproachPct: number;
  passingShotsAttempted: number;
  passingShotsWon: number;
  passingShotPct: number;
}

export interface PointDefinitionStats {
  cleanWinners: number;
  forcedErrors: number;
  unforcedErrors: number;
  total: number;
}

export interface StrokeMatrixRow {
  code: string;
  name: string;
  winners: number;
  forcedErrors: number;
  unforcedErrors: number;
  total: number;
}
