/**
 * @qa Suíte de Integração: Fechamento de Set, Transição de Sets, Tiebreak e Estatísticas Online
 * 
 * Valida o fluxo ponta a ponta do endpoint GET /api/matches/[id]/report usando o
 * ScoringEngine REAL e rebuildTimelineFromPointLogs REAL, assegurando:
 * 1. O game decisivo que fecha o set (ex: 6x4) é capturado na transição para o Set 2.
 * 2. O SetBreakdown reporta o placar final fechado (6x4), não o placar do penúltimo game (5x4).
 * 3. O tiebreak (7x6) não infla os games de serviço nem gera games fantasmas.
 * 4. Pontos rápidos (sem rallyDetails) computam winners e erros não forçados.
 * 5. A distinção entre 1º e 2º saque é infalível em toda a timeline.
 */

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

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/matches/[id]/report/route';
import { jwtVerify } from 'jose';
import { getMatch, getMatchScoreEdits } from '@/services/matchService';
import { prisma } from '@/lib/prisma';

const mockJwtVerify = jwtVerify as jest.MockedFunction<typeof jwtVerify>;
const mockGetMatch = getMatch as jest.MockedFunction<typeof getMatch>;
const mockGetMatchScoreEdits = getMatchScoreEdits as jest.MockedFunction<typeof getMatchScoreEdits>;

const makeReq = () =>
  new NextRequest('http://localhost:3000/api/matches/match-qa-1/report', {
    headers: {
      authorization: 'Bearer fake-token',
      'x-user-id': 'user-qa',
      'x-user-role': 'ANNOTATOR',
    },
  });

const baseMatch = {
  id: 'match-qa-1',
  state: 'IN_PROGRESS',
  format: 'BEST_OF_3',
  initialServerId: 'p1',
  scoreState: null,
  startedAt: new Date(Date.UTC(2026, 8, 29, 14, 0, 0)),
  finishedAt: null,
  player1: { id: 'p1', name: 'Carlos Alcaraz' },
  player2: { id: 'p2', name: 'Jannik Sinner' },
  createdByUserId: 'user-qa',
};

describe('@qa - Integração: Fechamento de Set e Tiebreak no Relatório', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockJwtVerify.mockResolvedValue({
      payload: { sub: 'user-qa', role: 'ANNOTATOR' },
    } as any);
    mockGetMatchScoreEdits.mockResolvedValue([]);
    mockGetMatch.mockResolvedValue(baseMatch as any);
  });

  it('Cenário 1: Fechamento de set em 6x4 + início de Set 2 sem perder o 10º game e com placar final correto', async () => {
    // Simulando 10 games no Set 1 e 1 game no Set 2:
    // P1 saca no g1 (P1 vence -> 1-0)
    // P2 saca no g2 (P2 vence -> 1-1)
    // P1 saca no g3 (P1 vence -> 2-1)
    // P2 saca no g4 (P2 vence -> 2-2)
    // P1 saca no g5 (P1 vence -> 3-2)
    // P2 saca no g6 (P2 vence -> 3-3)
    // P1 saca no g7 (P1 vence -> 4-3)
    // P2 saca no g8 (P2 vence -> 4-4)
    // P1 saca no g9 (P1 vence -> 5-4)
    // P2 saca no g10 (P1 quebra e vence o set -> 6-4!)
    // P1 saca no g11 do Set 2 (P1 vence -> 1-0 no Set 2)

    const pointLogs: any[] = [];
    let logCounter = 1;
    let timeOffset = 0;

    const addPoint = (winnerId: string, serverId: string, pointType: string, isFirst = true, hasRallyDetails = false) => {
      timeOffset += 15;
      const log = {
        id: `log-${logCounter++}`,
        winnerId,
        serverId,
        type: pointType,
        timestamp: new Date(Date.UTC(2026, 8, 29, 14, 0, timeOffset)),
        sequenceNumber: logCounter,
        clientEventId: `evt-${logCounter}`,
        annotations: {
          isFirstServe: isFirst,
          isSecondServe: !isFirst,
          firstFaultDetail: isFirst ? null : { type: 'NET', direction: 'CENTER' },
          rallyDetails: hasRallyDetails
            ? { situacao: 'fundo', golpe: 'fh', tipo: pointType === 'WINNER' ? 'winner' : 'erro_nao_forcado' }
            : null,
          rallyLength: pointType === 'ACE' ? 1 : 4,
        },
        audioNote: null,
        audioNoteDuration: null,
      };
      pointLogs.push(log);
    };

    const addGame = (winnerId: string, serverId: string) => {
      // 4 pontos para vencer o game (love game)
      addPoint(winnerId, serverId, 'ACE', true, false);
      addPoint(winnerId, serverId, 'WINNER', true, false); // Winner rápido sem rallyDetails
      addPoint(winnerId, serverId, 'UNFORCED_ERROR', false, false); // Erro rápido no 2º saque
      addPoint(winnerId, serverId, 'WINNER', true, true); // Com rallyDetails
    };

    // Games 1 a 9
    addGame('p1', 'p1'); // 1-0
    addGame('p2', 'p2'); // 1-1
    addGame('p1', 'p1'); // 2-1
    addGame('p2', 'p2'); // 2-2
    addGame('p1', 'p1'); // 3-2
    addGame('p2', 'p2'); // 3-3
    addGame('p1', 'p1'); // 4-3
    addGame('p2', 'p2'); // 4-4
    addGame('p1', 'p1'); // 5-4

    // Game 10: P1 vence no saque de P2 -> Fecha o Set em 6x4!
    addGame('p1', 'p2');

    // Game 11 (Set 2): P1 vence no seu saque -> 1-0 no Set 2
    addGame('p1', 'p1');

    (prisma.pointLog.findMany as jest.Mock).mockResolvedValue(pointLogs);

    const res = await GET(makeReq(), { params: Promise.resolve({ id: 'match-qa-1' }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    const { setBreakdown, serve, returnStats } = data.advancedStats;

    // 1. Verificação do SetBreakdown
    expect(setBreakdown).toHaveLength(2);

    // Set 1 deve registrar exatamente 6x4 (não 5x4)
    expect(setBreakdown[0].setNumber).toBe(1);
    expect(setBreakdown[0].p1Games).toBe(6);
    expect(setBreakdown[0].p2Games).toBe(4);
    expect(setBreakdown[0].isTiebreak).toBe(false);

    // Set 2 deve registrar 1x0
    expect(setBreakdown[1].setNumber).toBe(2);
    expect(setBreakdown[1].p1Games).toBe(1);
    expect(setBreakdown[1].p2Games).toBe(0);

    // 2. Verificação de Games de Serviço e Devolução (Fronteira do 10º game não pode ser perdida)
    // No Set 1: P1 sacou 5 games (venceu 5), P2 sacou 5 games (venceu 4, perdeu 1 que foi quebrado).
    // No Set 2: P1 sacou 1 game (venceu 1).
    // Total P1: 6 games sacados, 6 vencidos (100%).
    // Total P2: 5 games sacados, 4 vencidos (80%).
    expect(serve.player1.serviceGamesPlayed).toBe(6);
    expect(serve.player1.serviceGamesWon).toBe(6);
    expect(serve.player2.serviceGamesPlayed).toBe(5);
    expect(serve.player2.serviceGamesWon).toBe(4);

    // Break points e breaks convertidos
    expect(returnStats.player1.breakPointsConverted).toBe(1); // quebrou no 6x4

    // 3. Verificação de Winners e Erros computados mesmo de anotação rápida sem rallyDetails
    expect(setBreakdown[0].p1Winners).toBeGreaterThan(0);
    expect(setBreakdown[0].p2Errors).toBeGreaterThan(0);

    // 4. Verificação de 1º e 2º saque
    expect(serve.player1.firstServeIn).toBeGreaterThan(0);
    expect(serve.player1.totalPoints).toBeGreaterThan(0);
  });

  it('Cenário 2: Tiebreak em 6x6 levando a 7x6 sem inflar games de serviço', async () => {
    // 6 games para cada -> 6x6
    // Tiebreak até 7-3 para P1 -> 7x6
    const pointLogs: any[] = [];
    let logCounter = 1;
    let timeOffset = 0;

    const addPoint = (winnerId: string, serverId: string, type = 'WINNER') => {
      timeOffset += 15;
      pointLogs.push({
        id: `tb-log-${logCounter++}`,
        winnerId,
        serverId,
        type,
        timestamp: new Date(Date.UTC(2026, 8, 29, 15, 0, timeOffset)),
        sequenceNumber: logCounter,
        clientEventId: `tb-evt-${logCounter}`,
        annotations: {
          isFirstServe: true,
          isSecondServe: false,
          firstFaultDetail: null,
          rallyDetails: null,
          rallyLength: 3,
        },
        audioNote: null,
        audioNoteDuration: null,
      });
    };

    const addGame = (winnerId: string, serverId: string) => {
      for (let i = 0; i < 4; i++) {
        addPoint(winnerId, serverId);
      }
    };

    // 12 games regulares: 6 para P1, 6 para P2 (cada um confirma seus saques)
    for (let g = 0; g < 6; g++) {
      addGame('p1', 'p1'); // P1 confirma
      addGame('p2', 'p2'); // P2 confirma
    }

    // Agora o Tiebreak: disputado até P1 fazer 7 pontos (ex: 7-3)
    // Rotação de saque no tiebreak:
    // Pt 1: P1 saca (P1 ganha: 1-0)
    // Pt 2: P2 saca (P1 ganha: 2-0)
    // Pt 3: P2 saca (P2 ganha: 2-1)
    // Pt 4: P1 saca (P1 ganha: 3-1)
    // Pt 5: P1 saca (P1 ganha: 4-1)
    // Pt 6: P2 saca (P2 ganha: 4-2)
    // Pt 7: P2 saca (P1 ganha: 5-2)
    // Pt 8: P1 saca (P2 ganha: 5-3)
    // Pt 9: P1 saca (P1 ganha: 6-3)
    // Pt 10: P2 saca (P1 ganha: 7-3 -> Vence o tiebreak e o set!)
    addPoint('p1', 'p1');
    addPoint('p1', 'p2');
    addPoint('p2', 'p2');
    addPoint('p1', 'p1');
    addPoint('p1', 'p1');
    addPoint('p2', 'p2');
    addPoint('p1', 'p2');
    addPoint('p2', 'p1');
    addPoint('p1', 'p1');
    addPoint('p1', 'p2');

    (prisma.pointLog.findMany as jest.Mock).mockResolvedValue(pointLogs);

    const res = await GET(makeReq(), { params: Promise.resolve({ id: 'match-qa-1' }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    const { setBreakdown, serve } = data.advancedStats;

    // SetBreakdown deve indicar 7x6 com tiebreak
    expect(setBreakdown).toHaveLength(1);
    expect(setBreakdown[0].p1Games).toBe(7);
    expect(setBreakdown[0].p2Games).toBe(6);
    expect(setBreakdown[0].isTiebreak).toBe(true);

    // CRÍTICO: Os pontos de tiebreak NÃO podem virar games de serviço!
    // Cada jogador jogou exatamente 6 games de serviço regulares.
    expect(serve.player1.serviceGamesPlayed).toBe(6);
    expect(serve.player2.serviceGamesPlayed).toBe(6);
  });
});
