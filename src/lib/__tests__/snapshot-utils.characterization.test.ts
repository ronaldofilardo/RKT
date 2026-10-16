/**
 * TESTES DE CARACTERIZAÇÃO — snapshot-utils.ts (computeSnapshotStatus)
 *
 * Blindagem pré-refatoração STE-DEV (R-15). Congela o comportamento atual
 * de computeSnapshotStatus antes da remoção do `catch {}` vazio (R-08).
 *
 * Owner: @qa
 * Data: 2026-10-13
 */

import { describe, it, expect, jest, afterEach } from '@jest/globals';
import { computeSnapshotStatus } from '../snapshot.logic';

function buildSnapshot(historyLength: number): string {
  return JSON.stringify({
    state: { sets: [] },
    history: Array.from({ length: historyLength }, (_, i) => ({ point: i })),
  });
}

describe('computeSnapshotStatus — characterization', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('retorna BANK_AHEAD quando o snapshot é nulo', () => {
    expect(computeSnapshotStatus(null, 3)).toEqual({
      snapshotStatus: 'BANK_AHEAD',
      snapshotPointCount: 0,
    });
  });

  it('retorna IN_SYNC quando snapshot e banco têm a mesma contagem', () => {
    const result = computeSnapshotStatus(buildSnapshot(2), 2);
    expect(result).toEqual({ snapshotStatus: 'IN_SYNC', snapshotPointCount: 2 });
  });

  it('retorna SNAPSHOT_AHEAD quando o snapshot tem mais pontos que o banco', () => {
    const result = computeSnapshotStatus(buildSnapshot(5), 2);
    expect(result).toEqual({ snapshotStatus: 'SNAPSHOT_AHEAD', snapshotPointCount: 5 });
  });

  it('retorna BANK_AHEAD quando o banco tem mais pontos que o snapshot', () => {
    const result = computeSnapshotStatus(buildSnapshot(1), 4);
    expect(result).toEqual({ snapshotStatus: 'BANK_AHEAD', snapshotPointCount: 1 });
  });

  it('usa pointLogCount como fonte de verdade quando fornecido', () => {
    const result = computeSnapshotStatus(buildSnapshot(3), 99, 3);
    expect(result).toEqual({ snapshotStatus: 'IN_SYNC', snapshotPointCount: 3 });
  });

  it('zera a contagem quando o snapshot não possui history', () => {
    const result = computeSnapshotStatus(JSON.stringify({ state: { sets: [] } }), 2);
    expect(result).toEqual({ snapshotStatus: 'BANK_AHEAD', snapshotPointCount: 0 });
  });

  it('trata history que não é array como contagem zero', () => {
    const result = computeSnapshotStatus(JSON.stringify({ history: 'oops' }), 1);
    expect(result).toEqual({ snapshotStatus: 'BANK_AHEAD', snapshotPointCount: 0 });
  });

  it('trata snapshot vazio como ausente', () => {
    const result = computeSnapshotStatus('', 1);
    expect(result).toEqual({ snapshotStatus: 'BANK_AHEAD', snapshotPointCount: 0 });
  });

  it('não lança exceção com JSON inválido e conta zero pontos', () => {
    expect(() => computeSnapshotStatus('{not-json', 2)).not.toThrow();
    expect(computeSnapshotStatus('{not-json', 2)).toEqual({
      snapshotStatus: 'BANK_AHEAD',
      snapshotPointCount: 0,
    });
  });

  it('não lança exceção com JSON válido porém não-objeto', () => {
    expect(computeSnapshotStatus('42', 1)).toEqual({
      snapshotStatus: 'BANK_AHEAD',
      snapshotPointCount: 0,
    });
  });
});
