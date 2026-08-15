/**
 * @jest-environment jsdom
 */
/**
 * Investigação: o usuário reportou que observações textuais adicionadas no
 * modal de detalhes não estão sendo listadas na coluna OBSERVAÇÃO do
 * relatório (/report). Este teste verifica se `mergeWithPointLog` extrai
 * `note` corretamente dos três caminhos possíveis:
 *   1. annotations.note (persistido pelo backend)
 *   2. annotations.rallyDetails.note
 *   3. history pré-existente (p.note)
 */
import { rebuildTimelineFromPointLogs, type PointLogRow } from '@/components/scoring/timeline-rebuild';
import type { TimelinePoint } from '@/core/scoring/types';

function makeHistory(): TimelinePoint[] {
  return [
    {
      pointNumber: 1,
      winner: 'PLAYER_1',
      type: 'WINNER',
      server: 'player1',
      isFirstServe: true,
      isSecondServe: false,
      gameScore: { player1: 0, player2: 0 },
      gamesScore: { player1: 0, player2: 0 },
      setNumber: 1,
      isBreakPoint: false,
      isGameBall: false,
      isSetBall: false,
      rallyLength: 3,
      rallyDetails: null,
      pointDetails: {} as any,
      isTiebreak: false,
      gameIsDeuce: false,
      gameAdvantage: null,
    } as TimelinePoint,
  ];
}

function makeLog(overrides: Partial<PointLogRow>): PointLogRow {
  return {
    id: 'log-1',
    winnerId: 'p1',
    type: 'WINNER',
    serverId: 'p1',
    timestamp: new Date('2026-08-14T12:00:00Z'),
    annotations: null,
    audioNote: null,
    audioNoteDuration: null,
    ...overrides,
  };
}

describe('investigate: notas textuais na OBSERVAÇÃO do /report', () => {
  it('extrai note de annotations.note (caminho primário)', () => {
    const history = makeHistory();
    const logs: PointLogRow[] = [
      makeLog({
        annotations: {
          note: 'sacador errou bola fácil na paralela',
          rallyDetails: null,
          rallyLength: 3,
          isFirstServe: true,
        },
      }),
    ];
    const out = rebuildTimelineFromPointLogs(history, logs, 'p1', 'p2', 'p1');
    expect(out[0]?.note).toBe('sacador errou bola fácil na paralela');
  });

  it('extrai note de rallyDetails.note quando annotations.note é undefined', () => {
    const history = makeHistory();
    const logs: PointLogRow[] = [
      makeLog({
        annotations: {
          rallyDetails: { note: 'pressão no fundo' } as any,
          rallyLength: 3,
          isFirstServe: true,
        },
      }),
    ];
    const out = rebuildTimelineFromPointLogs(history, logs, 'p1', 'p2', 'p1');
    expect(out[0]?.note).toBe('pressão no fundo');
  });

  it('cai para p.note (history) quando nem annotations nem rallyDetails tem note', () => {
    const history = makeHistory();
    (history[0] as any).note = 'nota antiga no histórico';
    const logs: PointLogRow[] = [
      makeLog({
        annotations: { rallyDetails: null, rallyLength: 3 },
      }),
    ];
    const out = rebuildTimelineFromPointLogs(history, logs, 'p1', 'p2', 'p1');
    expect(out[0]?.note).toBe('nota antiga no histórico');
  });

  it('annotations = null → cai para p.note do history', () => {
    const history = makeHistory();
    (history[0] as any).note = 'vindo só do history';
    const logs: PointLogRow[] = [makeLog({ annotations: null })];
    const out = rebuildTimelineFromPointLogs(history, logs, 'p1', 'p2', 'p1');
    expect(out[0]?.note).toBe('vindo só do history');
  });
});
