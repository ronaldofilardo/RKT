import {
  rebuildTimelineFromPointLogs,
  type PointLogRow,
} from '@/core/scoring/timeline-rebuild';
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
    hasAudioNote: audio,
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
      'BEST_OF_3',
    );

    expect(result).toHaveLength(24);
    expect(result[23].pointId).toBe('log-24');

    // Primeiro ponto: placar inicial 0-0 (set 1, game 0-0); nunca mais zeros.
    expect(result[0].pointNumber).toBe(1);
    expect(result[0].pointId).toBe('log-1');
    expect(result[0].rallyDetails).not.toBeNull();
    expect(result[0].rallyDetails?.situacao).toBe('fundo');
    expect(result[0].gamesScore).toEqual({ player1: 0, player2: 0 });
    expect(result[0].setNumber).toBe(1);

    // Anotações detalhadas (rallyDetails) presentes em todas as 24 entries.
    for (const tp of result) {
      expect(tp.rallyDetails).not.toBeNull();
      expect(tp.rallyDetails?.golpe).toBe('fh');
    }

    // pointId preenchido a partir do PointLog.id em TODAS as entradas.
    expect(result.every(p => p.pointId?.startsWith('log-'))).toBe(true);

    // Não há mais fallback zero: cada ponto subsequente tem placar coerente
    // derivado do estado anterior. Em particular, o conjunto
    // (gamesScore, gameScore, setNumber) nunca deve ser simultaneamente
    // zeros a partir do segundo ponto.
    for (let i = 1; i < result.length; i++) {
      const r = result[i];
      const isAllZero =
        r.gamesScore.player1 === 0 &&
        r.gamesScore.player2 === 0 &&
        r.gameScore.player1 === 0 &&
        r.gameScore.player2 === 0 &&
        r.setNumber === 0;
      expect(isAllZero).toBe(false);
    }
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

  it('aplica scoreEdits simulando placar com estado ajustado no history vazio', () => {
    const pointLogs: PointLogRow[] = [
      makePointLog(1, player1Id, 'WINNER', {}),
      makePointLog(2, player2Id, 'WINNER', {}),
    ];
    // Set time for logs
    pointLogs[0].timestamp = new Date(Date.UTC(2026, 7, 1, 10, 0, 0));
    pointLogs[1].timestamp = new Date(Date.UTC(2026, 7, 1, 10, 5, 0));

    // Simulate an edit happening between log 1 and log 2
    const scoreEdits = [
      {
        editedAt: new Date(Date.UTC(2026, 7, 1, 10, 2, 0)),
        newScoreState: JSON.stringify({
          sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
          currentGame: { player1: 15, player2: 30, isDeuce: false, advantage: null, secondServe: false },
          server: 'player2',
          isFinished: false,
          winner: null,
          setsWon: { player1: 0, player2: 0 },
          startedAt: null,
          secondServe: false,
        }),
      }
    ];

    const result = rebuildTimelineFromPointLogs([], pointLogs, player1Id, player2Id, initialServerId, 'BEST_OF_3', scoreEdits);

    expect(result).toHaveLength(2);
    // Point 1 uses initial state
    expect(result[0].gameScore).toEqual({ player1: 0, player2: 0 });
    
    // Point 2 stateBefore should reflect the scoreEdit injected before its timestamp
    expect(result[1].gameScore).toEqual({ player1: 15, player2: 30 });
    // And because player2 won the second point from 15-30, the next state (not in stateBefore) would be 15-40, but stateBefore is 15-30.
    expect(result[1].server).toBe('player2');
  });

  it('fallback para buildPointDetailsFromLog quando engine rejeita ponto (ex: jogo finalizado)', () => {
    // Para forçar o erro do engine, simulamos 5 pontos onde o formato é BEST_OF_3,
    // e criamos um placar já de finalização pra causar MATCH_ALREADY_FINISHED.
    const pointLogs: PointLogRow[] = [
      makePointLog(1, player1Id, 'WINNER', {}),
      makePointLog(2, player1Id, 'WINNER', {}),
    ];
    
    const scoreEdits = [
      {
        editedAt: new Date(pointLogs[0].timestamp.getTime() - 1000),
        newScoreState: {
          sets: [{ player1: 6, player2: 0, isTiebreak: false, tiebreakScore: null }, { player1: 6, player2: 0, isTiebreak: false, tiebreakScore: null }],
          currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
          server: 'player1',
          isFinished: true,
          winner: 'player1',
          setsWon: { player1: 2, player2: 0 },
          startedAt: null,
          secondServe: false,
        },
      }
    ];

    // O engine vai carregar o scoreEdit. Quando for aplicar log 1, dará MATCH_ALREADY_FINISHED e usará o fallback.
    const result = rebuildTimelineFromPointLogs([], pointLogs, player1Id, player2Id, initialServerId, 'BEST_OF_3', scoreEdits);

    expect(result).toHaveLength(2);
    expect(result[0].pointId).toBe('log-1');
    expect(result[1].pointId).toBe('log-2');
    
    // Fallback preservou a informação (Winner)
    expect(result[0].winner).toBe('PLAYER_1');
    // Como fallback usa o stateBefore salvo anterior (que no caso foi pós edit)
    expect(result[0].gamesScore).toEqual({ player1: 0, player2: 0 }); 
    expect(result[0].setNumber).toBe(3); // or 2, depends on how enrichPoints interprets
  });

  it('extrai firstServeOutcome e secondServeOutcome em mergeWithPointLog', () => {
    const pointLogs: PointLogRow[] = [
      makePointLog(1, player1Id, 'ACE', {}), // isFirstServe, ACE
      makePointLog(2, player2Id, 'DOUBLE_FAULT', { subtipo2: 'net' }, false, { isSecondServe: true }), // DOUBLE_FAULT, net
      makePointLog(3, player1Id, 'FAULT_FIRST', {}, false, { firstFaultDetail: { errorType: 'out' } }) // FAULT_FIRST, out
    ];

    const result = rebuildTimelineFromPointLogs([], pointLogs, player1Id, player2Id, initialServerId);

    expect(result[0].firstServeOutcome).toBe('ace');
    expect(result[1].secondServeOutcome).toBe('net');
    expect(result[2].firstServeOutcome).toBe('out');
  });
});
