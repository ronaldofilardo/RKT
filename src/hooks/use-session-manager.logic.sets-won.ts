import type { SetEditData } from "@/core/scoring/edit-score-domain";
import { isMatchTiebreakSet } from "@/core/scoring/match-tiebreak-logic";

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
