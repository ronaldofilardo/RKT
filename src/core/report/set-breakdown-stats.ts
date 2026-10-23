import type { TimelinePoint } from '@/core/scoring/types';
import type { SetBreakdown } from './types';
import { computeCompletedGames } from './serve-return-stats';

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
  const tipo = p.rallyDetails?.tipo;
  const isWinner = tipo === 'winner' || p.type === 'WINNER';
  if (isWinner) {
    if (p.winner === 'PLAYER_1') entry.p1Winners++;
    if (p.winner === 'PLAYER_2') entry.p2Winners++;
    return;
  }

  if (p.type === 'DOUBLE_FAULT') {
    // D2: Em erros totais do set, entra como erro do sacador com atribuição explícita
    if (p.server === 'player1') entry.p1Errors++;
    else if (p.server === 'player2') entry.p2Errors++;
    return;
  }

  const isForced = tipo === 'erro_forcado' || p.type === 'FORCED_ERROR';
  const isUnforced = tipo === 'erro_nao_forcado' || p.type === 'UNFORCED_ERROR';
  if (isForced || isUnforced) {
    if (p.winner === 'PLAYER_2') entry.p1Errors++;
    if (p.winner === 'PLAYER_1') entry.p2Errors++;
  }
}

function updateSetPointStats(entry: SetBreakdown, p: TimelinePoint): void {
  entry.totalPoints++;
  if (p.winner === 'PLAYER_1') entry.p1Points++;
  else entry.p2Points++;

  if (p.isTiebreak) entry.isTiebreak = true;

  if (p.type === 'ACE') {
    if (p.server === 'player1') entry.p1Aces++;
    if (p.server === 'player2') entry.p2Aces++;
  }

  updateWinnerAndErrorStats(entry, p);
}

function calculateSetDuration(points: TimelinePoint[], setNumber: number): number | undefined {
  const setPoints = points.filter(p => p.setNumber === setNumber);
  if (setPoints.length < 2) return undefined;
  const firstTimestamp = setPoints[0].recordedAt;
  const lastTimestamp = setPoints[setPoints.length - 1].recordedAt;
  if (!firstTimestamp || !lastTimestamp) return undefined;
  const first = new Date(firstTimestamp).getTime();
  const last = new Date(lastTimestamp).getTime();
  return first && last ? Math.round((last - first) / 60000) : undefined;
}

export function computeSetBreakdown(points: TimelinePoint[]): SetBreakdown[] {
  const setMap = new Map<number, SetBreakdown>();
  const completed = computeCompletedGames(points);

  for (const p of points) {
    const s = p.setNumber;
    if (!setMap.has(s)) {
      setMap.set(s, initSetBreakdown(s));
    }
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
  for (const set of sets) {
    const duration = calculateSetDuration(points, set.setNumber);
    if (duration !== undefined) set.duration = duration;
  }

  return sets;
}
