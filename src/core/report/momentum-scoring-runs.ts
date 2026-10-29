import type { TimelinePoint } from '@/core/scoring/types';
import type { MomentumStats } from './types';

export function extractScoringRuns(points: TimelinePoint[]): MomentumStats['scoringRuns'] {
  const runs: MomentumStats['scoringRuns'] = [];
  let currentRun = 1;
  let currentWinner = points[0].winner;
  let runStart = 0;

  for (let i = 1; i < points.length; i++) {
    if (points[i].winner === currentWinner) {
      currentRun++;
    } else {
      if (currentRun >= 2) {
        runs.push({
          player: currentWinner,
          length: currentRun,
          start: runStart,
          end: i - 1,
        });
      }
      currentWinner = points[i].winner;
      currentRun = 1;
      runStart = i;
    }
  }

  if (currentRun >= 2) {
    runs.push({
      player: currentWinner,
      length: currentRun,
      start: runStart,
      end: points.length - 1,
    });
  }

  runs.sort((a, b) => b.length - a.length);
  return runs;
}
