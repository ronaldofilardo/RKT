import type { ScoringState, PointDetails, HistoryEntry } from './types';

export function saveToHistory(history: HistoryEntry[], state: ScoringState, point: PointDetails): void {
  history.push({
    stateBefore: JSON.parse(JSON.stringify(state)),
    point,
  });
}

export function undoLastPoint(
  history: HistoryEntry[],
  redoStack: HistoryEntry[],
  currentState: ScoringState,
): { stateBefore: ScoringState; point: PointDetails } | null {
  if (history.length === 0) return null;
  const entry = history.pop()!;
  redoStack.push({
    stateBefore: JSON.parse(JSON.stringify(currentState)),
    point: entry.point,
  });
  return { stateBefore: entry.stateBefore, point: entry.point };
}

export function replayCurrentPoint(
  redoStack: HistoryEntry[],
  undoStack: HistoryEntry[],
  currentState: ScoringState,
): { stateBefore: ScoringState; point: PointDetails } | null {
  if (redoStack.length === 0) return null;
  const entry = redoStack.pop()!;
  undoStack.push({
    stateBefore: JSON.parse(JSON.stringify(currentState)),
    point: entry.point,
  });
  return { stateBefore: entry.stateBefore, point: entry.point };
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

export function clearRedoHistory(redoStack: HistoryEntry[]): void {
  redoStack.length = 0;
}

export function getRedoLength(redoStack: HistoryEntry[]): number {
  return redoStack.length;
}