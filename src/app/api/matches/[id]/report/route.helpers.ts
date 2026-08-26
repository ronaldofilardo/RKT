import { getGameScoreLabel } from '@/core/scoring/scoring-logic';

type SnapshotRecord = Record<string, unknown>;
type SnapshotSet = { player1?: number; player2?: number; isTiebreak?: boolean };

function isRecord(value: unknown): value is SnapshotRecord { return typeof value === 'object' && value !== null; }
function asSet(value: unknown): SnapshotSet | undefined { return isRecord(value) ? { player1: typeof value.player1 === 'number' ? value.player1 : 0, player2: typeof value.player2 === 'number' ? value.player2 : 0, isTiebreak: value.isTiebreak === true } : undefined; }

function getSnapshotState(raw: unknown): SnapshotRecord {
  if (!isRecord(raw)) return {};
  return isRecord(raw.state) ? raw.state : raw;
}

function getSnapshotSet(parsed: SnapshotRecord): { setNumber: number; currentSet?: SnapshotSet } {
  const sets = Array.isArray(parsed.sets) ? parsed.sets : [];
  return { setNumber: sets.length > 0 ? sets.length : 1, currentSet: asSet(sets[sets.length - 1]) };
}

function getSnapshotPoints(parsed: SnapshotRecord, currentSet?: SnapshotSet): string {
  const game = isRecord(parsed.currentGame) ? parsed.currentGame : {};
  return getGameScoreLabel(
    typeof game.player1 === 'number' ? game.player1 : 0,
    typeof game.player2 === 'number' ? game.player2 : 0,
    game.isDeuce === true,
    typeof game.advantage === 'string' ? game.advantage : null,
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
