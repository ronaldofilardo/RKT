export interface ServeStats {
  totalPoints: number;
  firstServeIn: number;
  firstServePct: number;
  firstServePointsWon: number;
  firstServePointsWonPct: number;
  secondServePointsWon: number;
  secondServePointsWonPct: number;
  aces: number;
  doubleFaults: number;
  serviceGamesPlayed: number;
  serviceGamesWon: number;
  serviceGamesWonPct: number;
  breakPointsFaced: number;
  breakPointsSaved: number;
  breakPointsSavedPct: number;
  maxServeSpeed?: number;
}

export interface ReturnStats {
  totalPoints: number;
  firstServeReturnPointsWon: number;
  firstServeReturnPointsWonPct: number;
  secondServeReturnPointsWon: number;
  secondServeReturnPointsWonPct: number;
  returnGamesPlayed: number;
  returnGamesWon: number;
  returnGamesWonPct: number;
  breakPointOpportunities: number;
  breakPointsConverted: number;
  breakPointsConvertedPct: number;
  totalReturnPoints?: number;
  returnPointsWon?: number;
  returnPointsWonPct?: number;
  firstServeReturnInPct?: number;
  secondServeReturnInPct?: number;
}

export interface PressureStats {
  breakPointsSaved: number;
  breakPointsFaced: number;
  breakPointsConverted: number;
  breakPointOpportunities: number;
  gamePointsWon: number;
  gamePointsTotal: number;
  gamePointsWonPct: number;
  setPointsWon: number;
  setPointsTotal: number;
  setPointsWonPct: number;
  tiebreaksPlayed: number;
  tiebreaksWon: number;
  totalPointsWon: number;
}
