/**
 * Regressão: partida com múltiplas interrupções (MatchScoreEdit) não pode
 * duplicar pontos do Set 1 nem perder sets seguintes (Set 2 esparso, Set 3
 * ausente) — bug relatado pelo usuário em 14/08.
 *
 * Causa raiz: cada trecho era reconstruído a partir de `scoreState.history`,
 * que é CUMULATIVO desde o início da partida (não um delta do trecho). A
 * correção usa uma única simulação contínua sobre TODOS os PointLog.
 */
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
  scoreState: { sets: [], currentGame: { player1: 0, player2: 0 }, server: 'player1', isFinished: true, winner: 'player1', setsWon: { player1: 2, player2: 1 } },
  startedAt: null,
  finishedAt: null,
  player1: { id: 'p1', name: 'Ronaldo' },
  player2: { id: 'p2', name: 'Mateus' },
  createdByUserId: 'p1',
  ...overrides,
});

function makeReq() {
  return new NextRequest('http://localhost:3000/api/matches/match-1/report', {
    headers: {
      authorization: 'Bearer fake-token',
      'x-user-id': 'p1',
      'x-user-role': 'ATHLETE',
    },
  });
}

function makeLog(id: string, tSeconds: number, winnerId: string, type = 'ACE') {
  return {
    id,
    winnerId,
    type,
    serverId: 'p1',
    timestamp: new Date(Date.UTC(2026, 7, 14, 12, 0, tSeconds)),
    annotations: {
      rallyDetails: { situacao: 'saque', golpe: 'saque', tipo: 'winner', vencedor: 'sacador', previewBalls: 1 },
      rallyLength: 1,
      isFirstServe: true,
      isSecondServe: false,
    },
    audioNote: null,
    audioNoteDuration: null,
  };
}

describe('GET /api/matches/[id]/report — regressão: sem duplicar sets, sem perder o set final', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockJwtVerify.mockImplementation(async () => ({
      payload: { sub: 'p1', role: 'ATHLETE' },
    } as any));
  });

  it('partida com 2 interrupções (3 sets) devolve todos os PointLog uma única vez, sem duplicação', async () => {
    // 18 pontos "reais" espalhados pelos 3 sets, cronologicamente.
    const pointLogs = Array.from({ length: 18 }).map((_, i) =>
      makeLog(`log-${i + 1}`, i, i % 2 === 0 ? 'p1' : 'p2')
    );

    const { prisma } = require('@/lib/prisma');
    (prisma.pointLog.findMany as jest.Mock).mockResolvedValue(pointLogs);

    // Duas edições de placar (interrupções), como no caso relatado.
    const snap = {
      sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
      server: 'player1',
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
    };
    mockGetMatchScoreEdits.mockResolvedValue([
      {
        id: 'edit-1',
        editedAt: new Date(Date.UTC(2026, 7, 14, 12, 0, 6)),
        editedByUserId: 'p1',
        previousScoreState: snap,
        newScoreState: snap,
        note: null,
      },
      {
        id: 'edit-2',
        editedAt: new Date(Date.UTC(2026, 7, 14, 12, 0, 12)),
        editedByUserId: 'p1',
        previousScoreState: snap,
        newScoreState: snap,
        note: null,
      },
    ]);

    mockGetMatch.mockResolvedValue(mockMatch() as any);

    const res = await GET(makeReq(), { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(200);

    const data = await res.json();

    // Regressão central: nenhum PointLog aparece duas vezes na timeline.
    const pointIds = data.timelinePoints.map((p: any) => p.pointId);
    const uniqueIds = new Set(pointIds);
    expect(uniqueIds.size).toBe(pointIds.length);

    // Todos os 18 pontos anotados devem estar presentes — nada perdido
    // (o bug relatado fazia o Set 3 desaparecer inteiramente).
    expect(data.timelinePoints).toHaveLength(18);
    expect(pointIds).toEqual(Array.from({ length: 18 }).map((_, i) => `log-${i + 1}`));

    // pointNumber é contínuo e crescente do início ao fim, sem reiniciar
    // no meio da partida (o que produzia o "Set 1" duplicado na tela).
    const pointNumbers = data.timelinePoints.map((p: any) => p.pointNumber);
    expect(pointNumbers).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));

    expect(data.scoreEditsCount).toBe(2);
  });

  it('marcador de interrupção aparece só no primeiro PointLog após cada edição, não duplica os pontos anteriores', async () => {
    const pointLogs = [
      makeLog('A1', 0, 'p1'),
      makeLog('A2', 2, 'p1'),
      makeLog('B1', 8, 'p2'),
      makeLog('B2', 10, 'p2'),
    ];
    const { prisma } = require('@/lib/prisma');
    (prisma.pointLog.findMany as jest.Mock).mockResolvedValue(pointLogs);

    const snap = {
      sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
      server: 'player1',
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
    };
    const editedAt = new Date(Date.UTC(2026, 7, 14, 12, 0, 5));
    mockGetMatchScoreEdits.mockResolvedValue([
      { id: 'edit-1', editedAt, editedByUserId: 'p1', previousScoreState: snap, newScoreState: snap, note: null },
    ]);
    mockGetMatch.mockResolvedValue(mockMatch() as any);

    const res = await GET(makeReq(), { params: Promise.resolve({ id: 'match-1' }) });
    const data = await res.json();

    expect(data.timelinePoints).toHaveLength(4);
    expect(data.timelinePoints.map((p: any) => p.pointId)).toEqual(['A1', 'A2', 'B1', 'B2']);

    // Só B1 (primeiro ponto após a edição) carrega segmentBreak.
    expect(data.timelinePoints[2].segmentBreak).toBeDefined();
    expect(data.timelinePoints[2].pointId).toBe('B1');
    for (const idx of [0, 1, 3]) {
      expect(data.timelinePoints[idx].segmentBreak).toBeUndefined();
    }
  });
});
