import { getMatchFormatRules, isSetCompleteForFormat } from '@/lib/matchConfig';
import type { TennisFormat } from '@/lib/matchConfig';

export type SnapshotStatus = 'IN_SYNC' | 'SNAPSHOT_AHEAD' | 'BANK_AHEAD';

export interface CompletedSetsInfo {
  completedSets: Array<{ player1: number; player2: number }>;
  total: number;
  current: { player1: number; player2: number } | null;
  isFinished: boolean;
}

function parseSnapshot(snapshot: string) {
  const raw = JSON.parse(snapshot);
  return raw.state && Array.isArray(raw.history) ? raw.state : raw;
}

function getFormatRules(format: string): ReturnType<typeof getMatchFormatRules> | null {
  try { return getMatchFormatRules(format as TennisFormat); } catch { return null; }
}

function isCompletedSet(set: any, rules: ReturnType<typeof getMatchFormatRules> | null) {
  return rules
    ? isSetCompleteForFormat({ player1: set.player1, player2: set.player2 }, rules)
    : Math.max(set.player1, set.player2) >= 6 && Math.abs(set.player1 - set.player2) >= 2;
}

function getCompletedSets(sets: any[], format: string) {
  const rules = getFormatRules(format);
  return sets.filter((set) => isCompletedSet(set, rules));
}

export function getCompletedSetsInfo(matchStateSnapshot: string | null, format: string): CompletedSetsInfo | null {
  if (!matchStateSnapshot) return null;
  try {
    const snap = parseSnapshot(matchStateSnapshot);
    const sets = snap.sets ?? [];
    const completed = getCompletedSets(sets, format);
    return { completedSets: completed, total: completed.length, current: sets[sets.length - 1] ?? null, isFinished: snap.isFinished ?? false };
  } catch { return null; }
}
