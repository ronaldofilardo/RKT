jest.mock('@/lib/prisma', () => ({
  prisma: {
    pointLog: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

jest.mock('@/services/matchService', () => ({
  getMatch: jest.fn(),
  findAbandonedSessionSnapshot: jest.fn().mockResolvedValue(null),
  getMatchScoreEdits: jest.fn().mockResolvedValue([]),
}));

jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

jest.mock('@/core/scoring/engine', () => {
  // Stub mínimo de ScoringEngine usado pelo /report para SIMULAR o placar
  // acumulado quando o history do scoreState está incompleto. A simulação
  // simplesmente conta pontos por game alternando servidores; suficiente
  // para validar o contrato da rota (não a lógica fina do escore).
  const state0 = {
    sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: null,
    secondServe: false,
  };
  const handler = {
    applyPoint(flow: any) {
      this._hist.push({
        stateBefore: JSON.parse(JSON.stringify(this._state)),
        point: {
          winnerId: flow.winnerId,
          type: flow.type,
          isFirstServe: flow.isFirstServe ?? true,
          isSecondServe: flow.isSecondServe ?? false,
          isLet: false,
          serverId: flow.serverId,
          timestamp: flow.timestamp ?? Date.now(),
          rallyDetails: flow.rallyDetails ?? null,
          rallyLength: flow.rallyLength ?? 0,
          firstFaultDetail: flow.firstFaultDetail ?? null,
        },
      });
      const w = flow.winnerId === this._cfg.player1Id ? 'player1' : 'player2';
      const g = this._state.currentGame;
      if (flow.type === 'FAULT_FIRST') {
        g.secondServe = true;
      } else if (w === 'player1') {
        g.player1 += 1;
      } else {
        g.player2 += 1;
      }
      return this._state;
    },
    getState() {
      return JSON.parse(JSON.stringify(this._state));
    },
    getPointHistory() {
      return this._hist;
    },
  };
  return {
    ScoringEngine: Object.assign(
      function ScoringEngine(config: any) {
        const inst = Object.create(handler);
        inst._cfg = config;
        inst._state = JSON.parse(JSON.stringify(state0));
        inst._hist = [];
        return inst;
      },
      {
        fromSerialized: jest.fn().mockImplementation(() => ({
          getPointHistory: jest.fn().mockReturnValue([]),
        })),
      },
    ),
  };
});

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/matches/[id]/report/route';
import { jwtVerify } from 'jose';
import { getMatch, getMatchScoreEdits } from '@/services/matchService';

const mockJwtVerify = jwtVerify as jest.MockedFunction<typeof jwtVerify>;
const mockGetMatch = getMatch as jest.MockedFunction<typeof getMatch>;
const mockGetMatchScoreEdits = getMatchScoreEdits as jest.MockedFunction<typeof getMatchScoreEdits>;

const mockMatch = (overrides: Partial<any> = {}) => ({
  id: 'match-1',
  state: 'FINISHED',
  format: 'BEST_OF_3',
  initialServerId: 'p1',
  scoreState: { sets: [], currentGame: { player1: 0, player2: 0 }, server: 'player1', isFinished: true, winner: 'player1', setsWon: { player1: 0, player2: 0 } },
  startedAt: null,
  finishedAt: null,
  player1: { id: 'p1', name: 'Player 1' },
  player2: { id: 'p2', name: 'Player 2' },
  createdByUserId: 'creator-1',
  ...overrides,
});

function makeReq(userId: string = 'current-user', role: string = 'ATHLETE') {
  return new NextRequest('http://localhost:3000/api/matches/match-1/report', {
    headers: {
      authorization: 'Bearer fake-token',
      'x-user-id': userId,
      'x-user-role': role,
    },
  });
}

describe('GET /api/matches/[id]/report — autorização (regressão: anotador ≠ jogador)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // JWT válido por default; cada teste sobrepõe o payload se precisar
    mockJwtVerify.mockImplementation(async (token, secret) => ({
      payload: { sub: 'current-user', role: 'ATHLETE' },
    } as any));
    // Partidas sem edições manuais de placar seguem o caminho nominal
    // (sem segmentos). Cada teste que precisar de scoreEdits sobrepõe este mock.
    mockGetMatchScoreEdits.mockResolvedValue([]);
  });

  it('permite acesso quando usuário é player1', async () => {
    mockGetMatch.mockResolvedValue(mockMatch({ player1: { id: 'current-user', name: 'P1' } }) as any);

    const res = await GET(makeReq(), { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(200);
  });

  it('permite acesso quando usuário é player2', async () => {
    mockGetMatch.mockResolvedValue(mockMatch({ player2: { id: 'current-user', name: 'P2' } }) as any);

    const res = await GET(makeReq(), { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(200);
  });

  it('permite acesso quando usuário é o CRIADOR da partida (regressão do bug 403 em Partidas Anotadas)', async () => {
    // Anotador criou a partida; player1/player2 são atletas distintos do anotador
    mockGetMatch.mockResolvedValue(mockMatch({
      player1: { id: 'athlete-1', name: 'Atleta 1' },
      player2: { id: 'athlete-2', name: 'Atleta 2' },
      createdByUserId: 'current-user',
    }) as any);

    const res = await GET(makeReq(), { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(200);
  });

  it('permite acesso quando usuário é staff (ADMIN/GESTOR/COACH)', async () => {
    mockGetMatch.mockResolvedValue(mockMatch({
      player1: { id: 'p1', name: 'P1' },
      player2: { id: 'p2', name: 'P2' },
      createdByUserId: 'creator-1',
    }) as any);

    const res = await GET(makeReq('other-user', 'ADMIN'), { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(200);
  });

  it('bloqueia (403) quando usuário não é player, nem criador, nem staff', async () => {
    mockGetMatch.mockResolvedValue(mockMatch({
      player1: { id: 'p1', name: 'P1' },
      player2: { id: 'p2', name: 'P2' },
      createdByUserId: 'creator-1',
    }) as any);

    const res = await GET(makeReq('random-user', 'ATHLETE'), { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(403);
  });

  it('retorna 404 quando partida não existe', async () => {
    mockGetMatch.mockResolvedValue(null as any);

    const res = await GET(makeReq(), { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/matches/[id]/report — regressão: PointLog como fonte de verdade (match cmscejb8o)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockJwtVerify.mockImplementation(async () => ({
      payload: { sub: 'p1', role: 'ATHLETE' },
    } as any));
    mockGetMatchScoreEdits.mockResolvedValue([]);
  });

  it('quando PointLog > scoreState.history, reconstrói TODOS os PointLog na timeline', async () => {
    // ScoreState compacto (sem history) — o enrichment via engine não produz
    // nenhum ponto. Os 24 PointLog devem ainda assim aparecer no relatório.
    const pointLogs = Array.from({ length: 24 }).map((_, i) => ({
      id: `log-${i + 1}`,
      winnerId: i % 2 === 0 ? 'p1' : 'p2',
      type: i % 5 === 0 ? 'DOUBLE_FAULT' : 'ACE',
      serverId: 'p1',
      timestamp: new Date(Date.UTC(2026, 7, 1, 10, 0, i)),
      annotations: {
        rallyDetails: { situacao: 'saque', golpe: 'saque', tipo: 'winner', vencedor: 'sacador', previewBalls: 1 },
        rallyLength: 1,
        isFirstServe: true,
        isSecondServe: false,
      },
      audioNote: null,
      audioNoteDuration: null,
    }));

    const { prisma } = require('@/lib/prisma');
    (prisma.pointLog.findMany as jest.Mock).mockResolvedValue(pointLogs);

    mockGetMatch.mockResolvedValue(mockMatch({
      player1: { id: 'p1', name: 'Player 1' },
      player2: { id: 'p2', name: 'Player 2' },
    }) as any);

    const res = await GET(makeReq('p1', 'ATHLETE'), { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.timelinePoints).toHaveLength(24);
    // Cada ponto tem pointId vindo do PointLog.
    expect(data.timelinePoints[0].pointId).toBe('log-1');
    expect(data.timelinePoints[23].pointId).toBe('log-24');
    // rallyDetails preservados do PointLog em todos os 24.
    expect(data.timelinePoints.every((p: any) => p.rallyDetails?.situacao === 'saque')).toBe(true);
  });
});

describe('GET /api/matches/[id]/report — segmentos separados por MatchScoreEdit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockJwtVerify.mockImplementation(async () => ({
      payload: { sub: 'p1', role: 'ATHLETE' },
    } as any));
  });

  it('particiona PointLog em dois segmentos pela edição e marca o primeiro ponto do segmento final com segmentBreak', async () => {
    // Partida com 1 correção manual de placar no meio (MatchScoreEdit).
    // Os PointLogs são particionados pela hora da edição em dois segmentos;
    // a timeline final concatena os segmentos, na ordem, com um marcador de
    // interrupção (segmentBreak) no primeiro ponto do segmento final.
    const editEditedAt = new Date(Date.UTC(2026, 7, 1, 10, 0, 5));

    const makeLog = (id: string, tSeconds: number, winnerId: string) => ({
      id,
      winnerId,
      type: 'ACE',
      serverId: 'p1',
      timestamp: new Date(Date.UTC(2026, 7, 1, 10, 0, tSeconds)),
      annotations: {
        rallyDetails: { situacao: 'saque', golpe: 'saque', tipo: 'winner', vencedor: 'sacador', previewBalls: 1 },
        rallyLength: 1,
        isFirstServe: true,
        isSecondServe: false,
      },
      audioNote: null,
      audioNoteDuration: null,
    });

    const pointLogs = [
      // Segmento ANTERIOR à edição (3 pontos, t=0..2s, antes do editEditedAt=5s).
      makeLog('log-A1', 0, 'p1'),
      makeLog('log-A2', 1, 'p2'),
      makeLog('log-A3', 2, 'p1'),
      // Segmento POSTERIOR à edição (2 pontos, t=10..11s, depois do editEditedAt=5s).
      makeLog('log-B1', 10, 'p2'),
      makeLog('log-B2', 11, 'p1'),
    ];

    const { prisma } = require('@/lib/prisma');
    (prisma.pointLog.findMany as jest.Mock).mockResolvedValue(pointLogs);

    // Snapshot anterior à edição: Set 1, Game 6x4, pontos 40x30 — usado para
    // gerar previousLabel. Snapshot resultante da edição: mesmo array de
    // sets (length 1 — `setNumber` vira `sets.length` = 1) com placar zerado.
    // A função describeScoreSnapshotForDisplay usa sets.length, então o label
    // exibe "Set 1" mesmo após reiniciar (a UI decide a semântica detalhada).
    const previousScoreState = {
      sets: [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }],
      currentGame: { player1: 3, player2: 2, isDeuce: false, advantage: null },
      server: 'player1',
      isFinished: false,
      winner: null,
      setsWon: { player1: 1, player2: 0 },
    };
    const newScoreState = {
      sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
      server: 'player1',
      isFinished: false,
      winner: null,
      setsWon: { player1: 1, player2: 0 },
    };

    mockGetMatchScoreEdits.mockResolvedValue([
      {
        id: 'edit-1',
        editedAt: editEditedAt,
        editedByUserId: 'p1',
        previousScoreState,
        newScoreState,
        note: 'placar corrigido: 6x4 no 1o set, início do novo game/set',
      },
    ]);

    // Estado atual da partida contínua: 1 game já no 2o set, pontos 15x0.
    // (Reaproveitado como scoreState final do segmento posterior.)
    mockGetMatch.mockResolvedValue(mockMatch({
      player1: { id: 'p1', name: 'Player 1' },
      player2: { id: 'p2', name: 'Player 2' },
      scoreState: newScoreState,
    }) as any);

    const res = await GET(makeReq('p1', 'ATHLETE'), { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(200);

    const data = await res.json();

    // scoreEditsCount expõe o número de interrupções no payload.
    expect(data.scoreEditsCount).toBe(1);

    // Os 5 PointLog aparecem na timeline, concatenados na ordem dos segmentos.
    expect(data.timelinePoints).toHaveLength(5);
    expect(data.timelinePoints.map((p: any) => p.pointId)).toEqual([
      'log-A1', 'log-A2', 'log-A3',
      'log-B1', 'log-B2',
    ]);

    // pointNumber renumerado sequencialmente através dos dois segmentos
    // (cada segmento isoladamente numera a partir de 1).
    expect(data.timelinePoints.map((p: any) => p.pointNumber)).toEqual(
      [1, 2, 3, 4, 5],
    );

    // Apenas o PRIMEIRO ponto do segmento final (log-B1) carrega o
    // marcador de interrupção (segmentBreak). Os demais não.
    const pivot = data.timelinePoints[3];
    const others = [
      data.timelinePoints[0],
      data.timelinePoints[1],
      data.timelinePoints[2],
      data.timelinePoints[4],
    ];
    expect(pivot.pointId).toBe('log-B1');
    expect(pivot.segmentBreak).toEqual({
      editedAt: editEditedAt.toISOString(),
      previousLabel: 'Set 1 · Game 6x4 · 40x30',
      newLabel: 'Set 1 · Game 0x0 · 0x0',
    });
    for (const p of others) {
      expect(p.segmentBreak).toBeUndefined();
    }

    // A nota livre do MatchScoreEdit não vaza para a timeline (não faz parte
    // do contrato do segmentBreak), mas os rallyDetails do PointLog são
    // preservados em ambos os segmentos, mesmo após a partição.
    expect(data.timelinePoints.every((p: any) => p.rallyDetails?.situacao === 'saque')).toBe(true);
  });

  it('com múltiplas edições, particiona em N+1 segmentos e marca cada fronteira (exceto pontos sem log pós-fronteira)', async () => {
    // 2 edições → 3 janelas (antes-E1, E1..E2, depois-E2). O marcador é
    // injetado no primeiro ponto de cada segmento posterior (indice global
    // onde começa o novo segmento).
    const e1 = new Date(Date.UTC(2026, 7, 1, 10, 0, 5));
    const e2 = new Date(Date.UTC(2026, 7, 1, 10, 0, 15));
    const snap = {
      sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
      server: 'player1',
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
    };

    const makeLog = (id: string, tSeconds: number) => ({
      id,
      winnerId: 'p1',
      type: 'ACE',
      serverId: 'p1',
      timestamp: new Date(Date.UTC(2026, 7, 1, 10, 0, tSeconds)),
      annotations: {
        rallyDetails: { situacao: 'saque', golpe: 'saque', tipo: 'winner', vencedor: 'sacador', previewBalls: 1 },
        rallyLength: 1,
        isFirstServe: true,
        isSecondServe: false,
      },
      audioNote: null,
      audioNoteDuration: null,
    });

    const pointLogs = [
      makeLog('L-A1', 0), makeLog('L-A2', 2),           // Segmento 0 (antes de E1)
      makeLog('L-B1', 7), makeLog('L-B2', 9),            // Segmento 1 (E1..E2)
      makeLog('L-C1', 20), makeLog('L-C2', 22),          // Segmento 2 (depois de E2)
    ];

    const { prisma } = require('@/lib/prisma');
    (prisma.pointLog.findMany as jest.Mock).mockResolvedValue(pointLogs);

    mockGetMatchScoreEdits.mockResolvedValue([
      { id: 'edit-1', editedAt: e1, editedByUserId: 'p1', previousScoreState: snap, newScoreState: snap, note: null },
      { id: 'edit-2', editedAt: e2, editedByUserId: 'p1', previousScoreState: snap, newScoreState: snap, note: null },
    ]);

    mockGetMatch.mockResolvedValue(mockMatch({
      player1: { id: 'p1', name: 'Player 1' },
      player2: { id: 'p2', name: 'Player 2' },
      scoreState: snap,
    }) as any);

    const res = await GET(makeReq('p1', 'ATHLETE'), { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.scoreEditsCount).toBe(2);
    expect(data.timelinePoints).toHaveLength(6);
    expect(data.timelinePoints.map((p: any) => p.pointId)).toEqual(['L-A1','L-A2','L-B1','L-B2','L-C1','L-C2']);

    // Marcador no primeiro ponto do segmento 1 (L-B1, índice 2) e no
    // primeiro ponto do segmento 2 (L-C1, índice 4).
    expect(data.timelinePoints[2].segmentBreak).toEqual({
      editedAt: e1.toISOString(),
      previousLabel: 'Set 1 · Game 0x0 · 0x0',
      newLabel: 'Set 1 · Game 0x0 · 0x0',
    });
    expect(data.timelinePoints[4].segmentBreak).toEqual({
      editedAt: e2.toISOString(),
      previousLabel: 'Set 1 · Game 0x0 · 0x0',
      newLabel: 'Set 1 · Game 0x0 · 0x0',
    });
    // Pontos que não iniciam um novo segmento permanecem sem marcador.
    expect(data.timelinePoints[0].segmentBreak).toBeUndefined();
    expect(data.timelinePoints[5].segmentBreak).toBeUndefined();
  });

  it('partida sem scoreEdits permanece no caminho nominal (scoreEditsCount=0, sem segmentBreak)', async () => {
    const { prisma } = require('@/lib/prisma');
    (prisma.pointLog.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'solo-1',
        winnerId: 'p1',
        type: 'ACE',
        serverId: 'p1',
        timestamp: new Date(Date.UTC(2026, 7, 1, 10, 0, 0)),
        annotations: {
          rallyDetails: { situacao: 'saque', golpe: 'saque', tipo: 'winner', vencedor: 'sacador', previewBalls: 1 },
          rallyLength: 1,
          isFirstServe: true,
          isSecondServe: false,
        },
        audioNote: null,
        audioNoteDuration: null,
      },
    ]);
    mockGetMatchScoreEdits.mockResolvedValue([]);
    mockGetMatch.mockResolvedValue(mockMatch({
      player1: { id: 'p1', name: 'Player 1' },
      player2: { id: 'p2', name: 'Player 2' },
    }) as any);

    const res = await GET(makeReq('p1', 'ATHLETE'), { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.scoreEditsCount).toBe(0);
    expect(data.timelinePoints).toHaveLength(1);
    expect(data.timelinePoints[0].pointId).toBe('solo-1');
    expect(data.timelinePoints[0].segmentBreak).toBeUndefined();
  });
});
