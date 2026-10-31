import { computeStrokeMatrixStats } from '../stroke-matrix-stats.logic';

/** Ordem e rótulos canônicos exibidos na seção "8. Estatísticas dos Golpes" do /report. */
const EXPECTED_STROKES = [
  { code: 'sq', name: 'Sq' },
  { code: 'fh', name: 'FH' },
  { code: 'bh', name: 'BH' },
  { code: 'vfh', name: 'VFH' },
  { code: 'vbh', name: 'VBH' },
  { code: 'svfh', name: 'SVFH' },
  { code: 'svbh', name: 'SVBH' },
  { code: 'sm', name: 'Sm' },
  { code: 'drop', name: 'Drop' },
  { code: 'lob', name: 'Lob' },
  { code: 'bate_pronto', name: 'Bate Pronto' },
  { code: 'approach_fh', name: 'Aproach FH' },
  { code: 'approach_bh', name: 'Aproach BH' },
];

describe('Matriz de golpes - rótulos e ordem (regressão /report)', () => {
  it('retorna os 13 golpes na ordem canônica para os dois jogadores, mesmo sem pontos', () => {
    const labels = (rows: ReturnType<typeof computeStrokeMatrixStats>) =>
      rows.map((r) => ({ code: r.code, name: r.name }));

    expect(labels(computeStrokeMatrixStats([], 'PLAYER_1'))).toEqual(EXPECTED_STROKES);
    expect(labels(computeStrokeMatrixStats([], 'PLAYER_2'))).toEqual(EXPECTED_STROKES);
  });

  it('não exibe explicações entre parênteses nos nomes dos golpes', () => {
    for (const row of computeStrokeMatrixStats([], 'PLAYER_1')) {
      expect(row.name).not.toMatch(/[()]/);
    }
  });

  it('zera contadores de todos os golpes quando não há registro', () => {
    for (const row of computeStrokeMatrixStats([], 'PLAYER_1')) {
      expect(row.winners).toBe(0);
      expect(row.forcedErrors).toBe(0);
      expect(row.unforcedErrors).toBe(0);
      expect(row.total).toBe(0);
    }
  });

  it('classifica ace e dupla falta na linha Sq sem vazamento nos demais golpes', () => {
    const points = [
      { pointNumber: 1, winner: 'PLAYER_1', type: 'ACE', server: 'player1' },
      { pointNumber: 2, winner: 'PLAYER_2', type: 'DOUBLE_FAULT', server: 'player1' },
    ] as never[];

    const rows = computeStrokeMatrixStats(points, 'PLAYER_1');
    const sq = rows.find((r) => r.code === 'sq')!;
    const others = rows.filter((r) => r.code !== 'sq');

    expect(sq.winners).toBe(1);
    expect(sq.unforcedErrors).toBe(1);
    expect(sq.total).toBe(2);
    expect(others.every((r) => r.total === 0)).toBe(true);
  });
});
