import { diffFeedViews } from '../correction-diff';
import type { SpectatorView } from '../types';

function makeMockView(pointIds: string[], markers: Array<{ kind: 'SCORE_EDIT' | 'ARRANGEMENT_CHANGE'; at: string; description: string }> = []): SpectatorView {
  return {
    match: {
      id: 'm1',
      state: 'IN_PROGRESS',
      format: 'BEST_OF_3',
      matchType: 'SINGLES',
      sides: [
        { label: 'P1', members: [{ id: 'p1', name: 'Player 1' }] },
        { label: 'P2', members: [{ id: 'p2', name: 'Player 2' }] },
      ],
    },
    score: {
      sets: [{ player1: 1, player2: 0 }],
      currentGame: { player1: '15', player2: '0' },
      serverSide: 'side1',
    },
    points: pointIds.map((id, index) => ({
      id,
      seq: index + 1,
      setNumber: 1,
      gameNumber: 1,
      scoreAfter: '15-0',
      winnerSide: 'side1',
      type: 'ACE',
    })),
    markers,
  };
}

describe('diffFeedViews (detecção de desfazimentos e correções)', () => {
  it('não gera alerta na primeira carga (prev == null)', () => {
    const next = makeMockView(['pt1', 'pt2']);
    const diff = diffFeedViews(null, next);
    expect(diff.alert).toBeNull();
    expect(diff.newPointIds).toEqual(['pt1', 'pt2']);
    expect(diff.removedPointIds).toEqual([]);
  });

  it('detecta ponto desfeito (undo simples)', () => {
    const prev = makeMockView(['pt1', 'pt2']);
    const next = makeMockView(['pt1']);
    const diff = diffFeedViews(prev, next);
    expect(diff.removedPointIds).toEqual(['pt2']);
    expect(diff.alert).toEqual({
      kind: 'POINT_VOIDED',
      message: 'Correção do anotador: o último ponto foi desfeito',
    });
  });

  it('detecta múltiplos pontos desfeitos', () => {
    const prev = makeMockView(['pt1', 'pt2', 'pt3']);
    const next = makeMockView(['pt1']);
    const diff = diffFeedViews(prev, next);
    expect(diff.removedPointIds).toEqual(['pt2', 'pt3']);
    expect(diff.alert).toEqual({
      kind: 'POINT_VOIDED',
      message: 'Correção do anotador: 2 pontos foram desfeitos',
    });
  });

  it('detecta marcador de SCORE_EDIT com prioridade sobre remoção', () => {
    const prev = makeMockView(['pt1', 'pt2']);
    const next = makeMockView(['pt1'], [{ kind: 'SCORE_EDIT', at: '2026-10-29T12:00:00Z', description: 'Ajuste manual' }]);
    const diff = diffFeedViews(prev, next);
    expect(diff.hasScoreEdit).toBe(true);
    expect(diff.alert).toEqual({
      kind: 'SCORE_EDIT',
      message: 'Placar ajustado manualmente pelo anotador',
    });
  });

  it('detecta marcador de ARRANGEMENT_CHANGE', () => {
    const prev = makeMockView(['pt1']);
    const next = makeMockView(['pt1', 'pt2'], [{ kind: 'ARRANGEMENT_CHANGE', at: '2026-10-29T12:05:00Z', description: 'Troca de lados' }]);
    const diff = diffFeedViews(prev, next);
    expect(diff.hasArrangementChange).toBe(true);
    expect(diff.alert).toEqual({
      kind: 'ARRANGEMENT_CHANGE',
      message: 'Ordem de saque/devolução atualizada',
    });
  });
});

