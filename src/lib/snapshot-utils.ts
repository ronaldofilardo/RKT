export type SnapshotStatus = 'IN_SYNC' | 'SNAPSHOT_AHEAD' | 'BANK_AHEAD';

export function computeSnapshotStatus(
  matchStateSnapshot: string | null,
  matchVersion: number,
): { snapshotStatus: SnapshotStatus; snapshotPointCount: number } {
  let snapshotPointCount = 0;
  if (matchStateSnapshot) {
    try {
      const parsed = JSON.parse(matchStateSnapshot);
      snapshotPointCount = Array.isArray(parsed?.history) ? parsed.history.length : 0;
    } catch {}
  }
  const snapshotStatus: SnapshotStatus =
    snapshotPointCount > matchVersion ? 'SNAPSHOT_AHEAD'
    : matchVersion > snapshotPointCount ? 'BANK_AHEAD'
    : 'IN_SYNC';
  return { snapshotStatus, snapshotPointCount };
}
