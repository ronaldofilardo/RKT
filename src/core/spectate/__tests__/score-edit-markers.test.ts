import { buildScoreEditMarkers, describeScoreSnapshot } from '../../../services/spectator-feed.score-edits';

const snap = (sets: Array<[number, number]>, g1 = 0, g2 = 0, extra: Record<string, unknown> = {}) => ({
  sets: sets.map(([player1, player2]) => ({ player1, player2 })),
  currentGame: { player1: g1, player2: g2 },
  ...extra,
});

describe('describeScoreSnapshot', () => {
  it('descreve sets e game em texto legível', () => {
    expect(describeScoreSnapshot(snap([[6, 4], [3, 2]], 2, 2))).toBe('6-4, 3-2 · game 30-30');
  });

  it('aceita o envelope { state, history }', () => {
    expect(describeScoreSnapshot({ state: snap([[1, 0]], 1, 0), history: [] })).toBe('1-0 · game 15-0');
  });

  it('devolve null para dado inválido', () => {
    expect(describeScoreSnapshot(null)).toBeNull();
  });
});

describe('buildScoreEditMarkers', () => {
  const points = [
    { sequenceNumber: 1, timestamp: new Date('2026-10-29T12:00:00Z') },
    { sequenceNumber: 2, timestamp: new Date('2026-10-29T12:01:00Z') },
    { sequenceNumber: 3, timestamp: new Date('2026-10-29T12:10:00Z') },
  ];

  it('posiciona pelo pointLogSequenceAtEdit quando existe', () => {
    const [m] = buildScoreEditMarkers(
      [{ editedAt: new Date('2026-10-29T12:05:00Z'), previousScoreState: snap([[3, 2]]), newScoreState: snap([[6, 2]], 0, 0, { pointLogSequenceAtEdit: 2 }) }],
      points,
    );
    expect(m.afterSeq).toBe(2);
    expect(m.from).toBe('3-2 · game 0-0');
    expect(m.to).toBe('6-2 · game 0-0');
    expect(m.description).toContain('→');
  });

  it('cai para o horário da edição quando não há sequência', () => {
    const [m] = buildScoreEditMarkers(
      [{ editedAt: new Date('2026-10-29T12:05:00Z'), previousScoreState: snap([[0, 0]]), newScoreState: snap([[1, 0]]) }],
      points,
    );
    expect(m.afterSeq).toBe(2);
  });

  it('não expõe a nota da edição', () => {
    const [m] = buildScoreEditMarkers(
      [{ editedAt: new Date(), previousScoreState: snap([[0, 0]]), newScoreState: snap([[1, 0]]), note: 'segredo' } as never],
      points,
    );
    expect(JSON.stringify(m)).not.toContain('segredo');
  });
});
