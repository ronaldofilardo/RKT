import type { ScoringState, PointDetails, HistoryEntry } from './types';

export function saveToHistory(history: HistoryEntry[], state: ScoringState, point: PointDetails): void {
  history.push({
    stateBefore: JSON.parse(JSON.stringify(state)),
    point,
  });
}

export function undoLastPoint(
  history: HistoryEntry[],
  setState: (state: ScoringState) => void,
): PointDetails | null {
  if (history.length === 0) return null;
  const entry = history.pop()!;
  setState(entry.stateBefore);
  return entry.point;
}

export function replayCurrentPoint(
  _history: HistoryEntry[],
  _setState: (state: ScoringState) => void,
): void {
}

export function getHistoryLength(history: HistoryEntry[]): number {
  return history.length;
}

export function getPointHistory(history: HistoryEntry[]): HistoryEntry[] {
  return history;
}

export function restorePointHistory(history: HistoryEntry[], newHistory: HistoryEntry[]): void {
  history.length = 0;
  history.push(...newHistory);
}

export function clearHistory(history: HistoryEntry[]): void {
  history.length = 0;
}