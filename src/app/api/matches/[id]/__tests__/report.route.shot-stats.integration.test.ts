jest.mock('@/lib/prisma', () => ({
  prisma: {
    pointLog: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    matchComment: {
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
      if (w === 'player1') {
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

const makeReq = (userId = 'p1', role = 'ANNOTATOR') =>
  new NextRequest('http://localhost/api/matches/match-1/report', {
    headers: { authorization: `Bearer fake.${userId}.${role}` },
  });

describe('GET /api/matches/[id]/report — validação de agregação de golpes e erros técnicos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockJwtVerify.mockImplementation(async () => ({
      payload: { sub: 'p1', role: 'ANNOTATOR' },
    } as any));
    mockGetMatchScoreEdits.mockResolvedValue([]);
    mockGetMatch.mockResolvedValue({
      id: 'match-1',
      state: 'IN_PROGRESS',
      format: 'BEST_OF_3',
      initialServerId: 'p1',
      scoreState: null,
      startedAt: new Date(Date.UTC(2026, 7, 1, 10, 0, 0)),
      finishedAt: null,
      player1Id: 'p1',
      player2Id: 'p2',
      player1: { id: 'p1', name: 'Alice' },
      player2: { id: 'p2', name: 'Bob' },
      createdByUserId: 'p1',
    } as any);
  });

  it('exibe corretamente o balanço de backhand/forehand e erros atribuídos ao jogador real', async () => {
    // Cenário:
    // Pt 1: P1 acerta winner de forehand (Fundo) -> P1 ganha
    // Pt 2: P1 ganha por erro não forçado de backhand do P2 (Fundo)
    // Pt 3: P1 ganha por erro forçado de forehand do P2 (Rede - tentativa de passada do P2)
    // Pt 4: P2 acerta winner de backhand (Passada) -> P2 ganha
    // Pt 5: P2 ganha por erro não forçado de backhand do P1 (Fundo)
    const pointLogs = [
      {
        id: 'log-1',
        winnerId: 'p1',
        type: 'WINNER',
        serverId: 'p1',
        timestamp: new Date(Date.UTC(2026, 7, 1, 10, 0, 1)),
        annotations: {
          rallyDetails: { situacao: 'fundo', golpe: 'fh', tipo: 'winner' },
          rallyLength: 3,
        },
      },
      {
        id: 'log-2',
        winnerId: 'p1',
        type: 'UNFORCED_ERROR',
        serverId: 'p1',
        timestamp: new Date(Date.UTC(2026, 7, 1, 10, 0, 2)),
        annotations: {
          rallyDetails: { situacao: 'fundo', golpe: 'bh', tipo: 'erro_nao_forcado' },
          rallyLength: 5,
        },
      },
      {
        id: 'log-3',
        winnerId: 'p1',
        type: 'FORCED_ERROR',
        serverId: 'p1',
        timestamp: new Date(Date.UTC(2026, 7, 1, 10, 0, 3)),
        annotations: {
          rallyDetails: { situacao: 'rede', golpe: 'fh', tipo: 'erro_forcado' },
          rallyLength: 2,
        },
      },
      {
        id: 'log-4',
        winnerId: 'p2',
        type: 'WINNER',
        serverId: 'p1',
        timestamp: new Date(Date.UTC(2026, 7, 1, 10, 0, 4)),
        annotations: {
          rallyDetails: { situacao: 'passada', golpe: 'bh', tipo: 'winner' },
          rallyLength: 4,
        },
      },
      {
        id: 'log-5',
        winnerId: 'p2',
        type: 'UNFORCED_ERROR',
        serverId: 'p1',
        timestamp: new Date(Date.UTC(2026, 7, 1, 10, 0, 5)),
        annotations: {
          rallyDetails: { situacao: 'fundo', golpe: 'bh', tipo: 'erro_nao_forcado' },
          rallyLength: 6,
        },
      },
    ];

    const { prisma } = require('@/lib/prisma');
    (prisma.pointLog.findMany as jest.Mock).mockResolvedValue(pointLogs);

    const res = await GET(makeReq(), { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    const shots = data.advancedStats.shots;

    // Player 1 (Alice):
    // - Winner de FH: 1
    // - Erro Não Forçado de BH: 1 (cometido no Pt 5)
    // - Erro Forçado: 0
    expect(shots.player1.winnersByStroke.fh).toBe(1);
    expect(shots.player1.unforcedErrorsByStroke.bh).toBe(1);
    expect(shots.player1.forehandStats).toEqual({
      winners: 1,
      unforcedErrors: 0,
      forcedErrors: 0,
      total: 1,
    });
    expect(shots.player1.backhandStats).toEqual({
      winners: 0,
      unforcedErrors: 1,
      forcedErrors: 0,
      total: 1,
    });

    // Player 2 (Bob):
    // - Winner de BH: 1 (Pt 4)
    // - Erro Não Forçado de BH: 1 (cometido no Pt 2)
    // - Erro Forçado de FH: 1 (cometido no Pt 3)
    expect(shots.player2.winnersByStroke.bh).toBe(1);
    expect(shots.player2.unforcedErrorsByStroke.bh).toBe(1);
    expect(shots.player2.forcedErrorsByStroke.fh).toBe(1);
    expect(shots.player2.forehandStats).toEqual({
      winners: 0,
      unforcedErrors: 0,
      forcedErrors: 1,
      total: 1,
    });
    expect(shots.player2.backhandStats).toEqual({
      winners: 1,
      unforcedErrors: 1,
      forcedErrors: 0,
      total: 2,
    });
  });
});
