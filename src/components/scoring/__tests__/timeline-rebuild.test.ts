import {
  rebuildTimelineFromPointLogs,
  type PointLogRow,
} from '../timeline-rebuild';
import type {
  TimelinePoint,
  HistoryEntry,
  PointDetails,
  ScoringState,
} from '@/core/scoring/types';

const player1Id = 'cmsceii050001po851q2gok8s';
const player2Id = 'cmscei6jh0000po85rndn222s';
const initialServerId = player1Id;

function makePointLog(
  seq: number,
  winnerId: string,
  type: string,
  rallyDetails: any,
  audio: boolean = false,
  overrides: Partial<PointLogRow['annotations']> = {},
): PointLogRow {
  return {
    id: `log-${seq}`,
    winnerId,
    type,
    serverId: seq % 2 === 0 ? player2Id : player1Id,
    timestamp: new Date(Date.UTC(2026, 7, 1, 10, 0, 0, seq)),
    annotations: {
      rallyLength: 1,
      isFirstServe: true,
      isSecondServe: false,
      rallyDetails,
      ...overrides,
    },
    audioNote: audio ? Buffer.from([1, 2, 3]) : null,
    audioNoteDuration: audio ? 1500 : null,
  };
}

function makeHistoryTimeline(
  pointNumber: number,
  type: string,
  winnerId: string,
): TimelinePoint {
  const winner = winnerId === player1Id ? 'PLAYER_1' : 'PLAYER_2';
  const defaultState: ScoringState = {
    sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: null,
    secondServe: false,
  };
  const pointDetails: PointDetails = {
    winnerId,
    type: type as PointDetails['type'],
    isFirstServe: true,
    isSecondServe: false,
    isLet: false,
    serverId: player1Id,
    timestamp: Date.now(),
    rallyDetails: null,
    rallyLength: 1,
    firstFaultDetail: null,
  };
  return {
    pointNumber,
    winner,
    type,
    server: 'player1',
    isFirstServe: true,
    isSecondServe: false,
    gameScore: { player1: 0, player2: 0 },
    gamesScore: { player1: 5, player2: 4 },
    setNumber: 5,
    isBreakPoint: false,
    isGameBall: false,
    isSetBall: false,
    rallyLength: 1,
    rallyDetails: null,
    pointDetails,
    isTiebreak: false,
    gameIsDeuce: false,
    gameAdvantage: null,
  };
}

describe('rebuildTimelineFromPointLogs (regressão: match cmscejb8o com 24 PointLog e apenas 8 no history)', () => {
  it('quando pointLog > history, reconstrói TODOS os PointLog e mescla stateBefore do history para os últimos', () => {
    // Simula a partida: 24 PointLog, 8 no history (seqs 17-24).
    const pointLogs: PointLogRow[] = [];
    for (let i = 1; i <= 24; i++) {
      pointLogs.push(
        makePointLog(
          i,
          i % 2 === 0 ? player1Id : player2Id,
          i % 5 === 0 ? 'DOUBLE_FAULT' : 'ACE',
          { situacao: 'fundo', golpe: 'fh', tipo: 'winner', vencedor: 'sacador', previewBalls: 1 },
        ),
      );
    }

    const history: TimelinePoint[] = [];
    for (let i = 17; i <= 24; i++) {
      history.push(makeHistoryTimeline(i - 16, 'ACE', i % 2 === 0 ? player1Id : player2Id));
    }

    const result = rebuildTimelineFromPointLogs(
      history,
      pointLogs,
      player1Id,
      player2Id,
      initialServerId,
    );

    expect(result).toHaveLength(24);
    // Últimos 8 preservam stateBefore do history (gamesScore 5-4).
    expect(result[23].gamesScore).toEqual({ player1: 5, player2: 4 });
    expect(result[23].setNumber).toBe(5);
    expect(result[23].pointId).toBe('log-24');

    // Primeiros 16 reconstruídos a partir do PointLog (stateBefore parcial).
    expect(result[0].pointNumber).toBe(1);
    expect(result[0].pointId).toBe('log-1');
    expect(result[0].rallyDetails).not.toBeNull();
    expect(result[0].rallyDetails?.situacao).toBe('fundo');

    // Anotações detalhadas (rallyDetails) presentes em todas as 24 entries.
    for (const tp of result) {
      expect(tp.rallyDetails).not.toBeNull();
      expect(tp.rallyDetails?.golpe).toBe('fh');
    }

    // pointId preenchido a partir do PointLog.id em TODAS as entradas.
    expect(result.every(p => p.pointId?.startsWith('log-'))).toBe(true);
  });

  it('quando history cobre tudo, mescla annotations e preserva stateBefore', () => {
    const pointLogs: PointLogRow[] = [
      makePointLog(1, player1Id, 'ACE', { situacao: 'saque', golpe: 'saque', tipo: 'winner', vencedor: 'sacador', previewBalls: 1 }),
      makePointLog(2, player2Id, 'WINNER', { situacao: 'fundo', golpe: 'bh', tipo: 'winner', vencedor: 'devolvedor', previewBalls: 3 }),
    ];
    const history: TimelinePoint[] = [
      { ...makeHistoryTimeline(1, 'ACE', player1Id), rallyDetails: null },
      { ...makeHistoryTimeline(2, 'WINNER', player2Id), rallyDetails: null },
    ];

    const result = rebuildTimelineFromPointLogs(history, pointLogs, player1Id, player2Id, initialServerId);

    expect(result).toHaveLength(2);
    // Annotations do PointLog sobrescrevem null do history.
    expect(result[0].rallyDetails?.situacao).toBe('saque');
    expect(result[1].rallyDetails?.golpe).toBe('bh');
    // stateBefore conservado.
    expect(result[0].setNumber).toBe(5);
  });

  it('quando history vazio, reconstrói TODOS os PointLog com stateBefore parcial', () => {
    const pointLogs: PointLogRow[] = [
      makePointLog(1, player1Id, 'ACE', { situacao: 'saque', golpe: 'saque', tipo: 'winner', vencedor: 'sacador', previewBalls: 1 }),
      makePointLog(2, player2Id, 'UNFORCED_ERROR', { situacao: 'fundo', golpe: 'fh', tipo: 'erro_nao_forcado', vencedor: 'devolvedor', previewBalls: 1 }),
    ];

    const result = rebuildTimelineFromPointLogs([], pointLogs, player1Id, player2Id, initialServerId);

    expect(result).toHaveLength(2);
    expect(result[0].winner).toBe('PLAYER_1');
    expect(result[1].winner).toBe('PLAYER_2');
    expect(result[0].rallyDetails?.tipo).toBe('winner');
    expect(result[1].rallyDetails?.tipo).toBe('erro_nao_forcado');
    expect(result[0].pointId).toBe('log-1');
  });

  it('quando há áudio no PointLog, hasAudioNote fica true', () => {
    const pointLogs: PointLogRow[] = [
      makePointLog(1, player1Id, 'ACE', { situacao: 'saque', golpe: 'saque', tipo: 'winner', vencedor: 'sacador', previewBalls: 1 }, true),
    ];

    const result = rebuildTimelineFromPointLogs([], pointLogs, player1Id, player2Id, initialServerId);

    expect(result[0].hasAudioNote).toBe(true);
    expect(result[0].audioNoteDuration).toBe(1500);
    expect(result[0].pointId).toBe('log-1');
  });

  it('reconhece firstFaultDetail das annotations do PointLog', () => {
    const pointLogs: PointLogRow[] = [
      makePointLog(
        1,
        player2Id,
        'DOUBLE_FAULT',
        { situacao: 'saque', golpe: 'saque', tipo: 'dupla_falta', vencedor: 'devolvedor', previewBalls: 1 },
        false,
        {
          firstFaultDetail: { errorType: 'net', serveEffect: 'flat', direction: 'centro' },
        },
      ),
    ];

    const result = rebuildTimelineFromPointLogs([], pointLogs, player1Id, player2Id, initialServerId);

    expect(result[0].firstFault).toEqual({ errorType: 'net', serveEffect: 'flat', direction: 'centro' });
    expect(result[0].type).toBe('DOUBLE_FAULT');
  });

  it('preserva note das annotations do PointLog', () => {
    const pointLogs: PointLogRow[] = [
      makePointLog(
        1,
        player1Id,
        'WINNER',
        { situacao: 'passada', golpe: 'fh', tipo: 'winner', vencedor: 'sacador', previewBalls: 2, note: 'observação livre' },
        false,
        { note: 'note no top-level' },
      ),
    ];

    const result = rebuildTimelineFromPointLogs([], pointLogs, player1Id, player2Id, initialServerId);

    // Preferência: note top-level das annotations; fallback rallyDetails.note.
    expect(result[0].note).toBe('note no top-level');
  });

  it('caminho sem PointLog retorna history original', () => {
    const history: TimelinePoint[] = [
      { ...makeHistoryTimeline(1, 'ACE', player1Id) },
    ];
    const result = rebuildTimelineFromPointLogs(history, [], player1Id, player2Id, initialServerId);
    expect(result).toEqual(history);
  });
});
