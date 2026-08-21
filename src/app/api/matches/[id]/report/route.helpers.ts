import { getGameScoreLabel } from '@/components/scoring/timeline-utils';

function getSnapshotState(raw: unknown): any {
  return raw && typeof raw === 'object' && 'state' in (raw as any)
    ? (raw as any).state
    : raw;
}

function getSnapshotSet(parsed: any) {
  const sets = parsed?.sets ?? [];
  return { setNumber: sets.length > 0 ? sets.length : 1, currentSet: sets[sets.length - 1] };
}

function getSnapshotPoints(parsed: any, currentSet: any): string {
  return getGameScoreLabel(
    parsed?.currentGame?.player1 ?? 0,
    parsed?.currentGame?.player2 ?? 0,
    parsed?.currentGame?.isDeuce,
    parsed?.currentGame?.advantage,
    currentSet?.isTiebreak,
  );
}

export function describeScoreSnapshotForDisplay(raw: unknown): string {
  try {
    const parsed = getSnapshotState(raw);
    const { setNumber, currentSet } = getSnapshotSet(parsed);
    const games = `${currentSet?.player1 ?? 0}x${currentSet?.player2 ?? 0}`;
    return `Set ${setNumber} · Game ${games} · ${getSnapshotPoints(parsed, currentSet)}`;
  } catch {
    return '–';
  }
}
