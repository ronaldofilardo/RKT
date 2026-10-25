import type { TimelinePoint } from '@/core/scoring/types';
import type { SetBreakdown } from './types';
import { computeCompletedGames } from './serve-return-stats';
import {
  isRallyWinnerPoint,
  isDoubleFaultPoint,
  isForcedErrorPoint,
  isUnforcedErrorPoint,
} from '@/core/scoring/game-error-classify.logic';

function initSetBreakdown(setNumber: number): SetBreakdown {
  return {
    setNumber,
    totalPoints: 0,
    p1Points: 0,
    p2Points: 0,
    p1Games: 0,
    p2Games: 0,
    isTiebreak: false,
    p1Aces: 0,
    p2Aces: 0,
    p1Winners: 0,
    p2Winners: 0,
    p1Errors: 0,
    p2Errors: 0,
  };
}

function updateWinnerAndErrorStats(entry: SetBreakdown, p: TimelinePoint): void {
  if (isRallyWinnerPoint(p)) {
    if (p.winner === 'PLAYER_1') entry.p1Winners++;
    else entry.p2Winners++;
    return;
  }

  if (isDoubleFaultPoint(p)) {
    if (p.server === 'player1') entry.p1Errors++;
    else if (p.server === 'player2') entry.p2Errors++;
    return;
  }

  if (isForcedErrorPoint(p) || isUnforcedErrorPoint(p)) {
    if (p.winner === 'PLAYER_2') entry.p1Errors++;
    else entry.p2Errors++;
  }
}

function updateSetPointStats(entry: SetBreakdown, p: TimelinePoint): void {
  entry.totalPoints++;
  if (p.winner === 'PLAYER_1') entry.p1Points++;
  else entry.p2Points++;

  if (p.isTiebreak) {
    entry.isTiebreak = true;
    if (p.winner === 'PLAYER_1') entry.tiebreakP1 = (entry.tiebreakP1 || 0) + 1;
    else entry.tiebreakP2 = (entry.tiebreakP2 || 0) + 1;
  }

  if (p.type === 'ACE') {
    if (p.server === 'player1') entry.p1Aces++;
    else if (p.server === 'player2') entry.p2Aces++;
  }

  updateWinnerAndErrorStats(entry, p);
}

import { computeMatchDurations } from './report-duration.logic';

export function computeSetBreakdown(points: TimelinePoint[]): SetBreakdown[] {
  const setMap = new Map<number, SetBreakdown>();
  const completed = computeCompletedGames(points);

  for (const p of points) {
    const s = p.setNumber;
    if (!setMap.has(s)) setMap.set(s, initSetBreakdown(s));
    updateSetPointStats(setMap.get(s)!, p);
  }

  for (const g of completed) {
    const entry = setMap.get(g.setNumber);
    if (entry) {
      if (g.winner === 'PLAYER_1') entry.p1Games++;
      else entry.p2Games++;
    }
  }

  const sets = Array.from(setMap.values());
  const durations = computeMatchDurations(points);

  for (const set of sets) {
    const sStat = durations.setDurations.find(d => d.setNumber === set.setNumber);
    if (sStat) {
      set.duration = sStat.totalMinutes;
      set.effectiveDuration = sStat.effectiveMinutes;
    }
  }

  return sets;
}
