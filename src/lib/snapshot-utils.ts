export type SnapshotStatus = 'IN_SYNC' | 'SNAPSHOT_AHEAD' | 'BANK_AHEAD';

/**
 * Determina o status do snapshot de uma sessão suspensa.
 *
 * @param matchVersion - Versão atual da partida (incrementa com qualquer mutação:
 *   point, undo, edit-score). Usado como fallback quando pointLogCount não é
 *   fornecido.
 * @param pointLogCount - (opcional) Número real de pontos registrados no banco
 *   (PointLog entries). Mais preciso que matchVersion porque edit-score e undo
 *   incrementam version sem adicionar PointLog.
 */
export function computeSnapshotStatus(
  matchStateSnapshot: string | null,
  matchVersion: number,
  pointLogCount?: number,
): { snapshotStatus: SnapshotStatus; snapshotPointCount: number } {
  let snapshotPointCount = 0;
  if (matchStateSnapshot) {
    try {
      const parsed = JSON.parse(matchStateSnapshot);
      snapshotPointCount = Array.isArray(parsed?.history) ? parsed.history.length : 0;
    } catch {}
  }
  // Usar pointLogCount (contagem real de pontos) quando disponível.
  // matchVersion pode ser inflado por edit-score/undo que não criam PointLog.
  const serverPointCount = pointLogCount ?? matchVersion;
  const snapshotStatus: SnapshotStatus =
    snapshotPointCount > serverPointCount ? 'SNAPSHOT_AHEAD'
    : serverPointCount > snapshotPointCount ? 'BANK_AHEAD'
    : 'IN_SYNC';
  return { snapshotStatus, snapshotPointCount };
}
