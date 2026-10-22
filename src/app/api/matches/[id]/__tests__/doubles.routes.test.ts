const mockTx = {
  match: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  pointLog: {
    count: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    aggregate: jest.fn(),
  },
  matchScoreEdit: {
    create: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: {
    match: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((cb: any) =>
      typeof cb === 'function' ? cb(mockTx) : Promise.all(cb)
    ),
  },
}));

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PATCH as statePATCH } from '../state/route';
import { POST as arrangementPOST } from '../arrangement/route';
import { POST as pointPOST } from '../point/route';
import { makeAuthHeaders } from '@/test-helpers/auth';

const mockPrisma = prisma as any;

const P1_ID = 'cjs5nqpr7000001l29u6qr9f1';
const P2_ID = 'cjs5nqpr7000001l29u6qr9f2';
const P1_PARTNER_ID = 'cjs5nqpr7000001l29u6qr9f3';
const P2_PARTNER_ID = 'cjs5nqpr7000001l29u6qr9f4';
const INTRUDER_ID = 'cjs5nqpr7000001l29u6qr9f9';

const baseDoublesMatch = {
  id: 'match-doubles-1',
  state: 'IN_PROGRESS',
  format: 'BEST_OF_3',
  version: 1,
  matchType: 'DOUBLES',
  player1Id: P1_ID,
  player2Id: P2_ID,
  player1PartnerId: P1_PARTNER_ID,
  player2PartnerId: P2_PARTNER_ID,
  initialServerId: P1_ID,
  player1: { id: P1_ID, name: 'Player 1' },
  player2: { id: P2_ID, name: 'Player 2' },
  player1Partner: { id: P1_PARTNER_ID, name: 'Player 1 Partner' },
  player2Partner: { id: P2_PARTNER_ID, name: 'Player 2 Partner' },
  createdByUserId: 'user-annotator',
  openForAnnotation: false,
  doublesSetup: {
    serveOrder: {
      player1: [P1_ID, P1_PARTNER_ID],
      player2: [P2_ID, P2_PARTNER_ID],
    },
    receiveDeuce: {
      player1: P1_ID,
      player2: P2_ID,
    },
    changes: [],
  },
  scoreState: {
    state: {
      sets: [],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1',
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
      startedAt: Date.now(),
      secondServe: false,
      doubles: {
        serveOrder: {
          player1: [P1_ID, P1_PARTNER_ID],
          player2: [P2_ID, P2_PARTNER_ID],
        },
        receiveDeuce: {
          player1: P1_ID,
          player2: P2_ID,
        },
        serveIndex: {
          player1: 0,
          player2: 0,
        },
      },
    },
    history: [],
  },
};

let ANNOTATOR_HEADERS: Record<string, string> = {};

beforeAll(async () => {
  ANNOTATOR_HEADERS = await makeAuthHeaders('user-annotator', 'ANNOTATOR');
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Doubles API Integration Routes', () => {
  describe('PATCH /api/matches/[id]/state (Transição em Duplas)', () => {
    it('rejeita transição para IN_PROGRESS em duplas se doublesSetup estiver ausente', async () => {
      const scheduledMatch = {
        ...baseDoublesMatch,
        state: 'SCHEDULED',
        doublesSetup: null,
      };
      mockPrisma.match.findFirst.mockResolvedValue(scheduledMatch);
      mockPrisma.match.findUnique.mockResolvedValue(scheduledMatch);

      const req = new NextRequest('http://localhost:3000/api/matches/match-doubles-1/state', {
        method: 'PATCH',
        body: JSON.stringify({ state: 'IN_PROGRESS' }),
        headers: { 'Content-Type': 'application/json', ...ANNOTATOR_HEADERS },
      });

      const res = await statePATCH(req, { params: Promise.resolve({ id: 'match-doubles-1' }) });
      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.error).toBe('DOUBLES_SETUP_REQUIRED');
    });

    it('aceita transição para IN_PROGRESS quando doublesSetup válido é fornecido no body', async () => {
      const scheduledMatch = {
        ...baseDoublesMatch,
        state: 'SCHEDULED',
        doublesSetup: null,
      };
      mockPrisma.match.findFirst.mockResolvedValue(scheduledMatch);
      mockPrisma.match.findUnique.mockResolvedValue(scheduledMatch);

      mockTx.match.update.mockResolvedValue({
        ...baseDoublesMatch,
        state: 'IN_PROGRESS',
        version: 2,
      });

      const req = new NextRequest('http://localhost:3000/api/matches/match-doubles-1/state', {
        method: 'PATCH',
        body: JSON.stringify({
          state: 'IN_PROGRESS',
          doublesSetup: {
            serveOrder: {
              player1: [P1_ID, P1_PARTNER_ID],
              player2: [P2_ID, P2_PARTNER_ID],
            },
            receiveDeuce: {
              player1: P1_ID,
              player2: P2_ID,
            },
          },
        }),
        headers: { 'Content-Type': 'application/json', ...ANNOTATOR_HEADERS },
      });

      const res = await statePATCH(req, { params: Promise.resolve({ id: 'match-doubles-1' }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.state).toBe('IN_PROGRESS');
    });
  });

  describe('POST /api/matches/[id]/arrangement (Formação entre Sets)', () => {
    it('rejeita arrangement com atletas que não pertencem à dupla', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(baseDoublesMatch);

      const req = new NextRequest('http://localhost:3000/api/matches/match-doubles-1/arrangement', {
        method: 'POST',
        body: JSON.stringify({
          version: 1,
          afterSet: 1,
          serveOrder: {
            player1: [P1_ID, INTRUDER_ID],
            player2: [P2_ID, P2_PARTNER_ID],
          },
          receiveDeuce: {
            player1: P1_ID,
            player2: P2_ID,
          },
        }),
        headers: { 'Content-Type': 'application/json', ...ANNOTATOR_HEADERS },
      });

      const res = await arrangementPOST(req, { params: Promise.resolve({ id: 'match-doubles-1' }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('INVALID_DOUBLES_ARRANGEMENT');
    });

    it('aceita novo arrangement válido e persiste com versão incrementada', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(baseDoublesMatch);
      mockTx.match.update.mockResolvedValue({
        ...baseDoublesMatch,
        version: 2,
      });

      const req = new NextRequest('http://localhost:3000/api/matches/match-doubles-1/arrangement', {
        method: 'POST',
        body: JSON.stringify({
          version: 1,
          afterSet: 1,
          serveOrder: {
            player1: [P1_PARTNER_ID, P1_ID],
            player2: [P2_ID, P2_PARTNER_ID],
          },
          receiveDeuce: {
            player1: P1_PARTNER_ID,
            player2: P2_ID,
          },
        }),
        headers: { 'Content-Type': 'application/json', ...ANNOTATOR_HEADERS },
      });

      const res = await arrangementPOST(req, { params: Promise.resolve({ id: 'match-doubles-1' }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.version).toBe(2);
    });

    it('retorna 409 VERSION_CONFLICT se a versão não bater (conflito otimista)', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        ...baseDoublesMatch,
        version: 2,
      });
      mockTx.match.update.mockRejectedValueOnce({ code: 'P2025' });

      const req = new NextRequest('http://localhost:3000/api/matches/match-doubles-1/arrangement', {
        method: 'POST',
        body: JSON.stringify({
          version: 1,
          afterSet: 1,
          serveOrder: {
            player1: [P1_PARTNER_ID, P1_ID],
            player2: [P2_ID, P2_PARTNER_ID],
          },
          receiveDeuce: {
            player1: P1_ID,
            player2: P2_ID,
          },
        }),
        headers: { 'Content-Type': 'application/json', ...ANNOTATOR_HEADERS },
      });

      const res = await arrangementPOST(req, { params: Promise.resolve({ id: 'match-doubles-1' }) });
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toBe('VERSION_CONFLICT');
    });
  });

  describe('POST /api/matches/[id]/point (Pontos em Duplas)', () => {
    it('rejeita ponto com hitterId que não pertence a nenhum dos quatro atletas', async () => {
      mockTx.match.findFirst.mockResolvedValue(baseDoublesMatch);

      const req = new NextRequest('http://localhost:3000/api/matches/match-doubles-1/point', {
        method: 'POST',
        body: JSON.stringify({
          winnerId: P1_ID,
          serverId: P1_ID,
          type: 'WINNER',
          hitterId: INTRUDER_ID,
          version: 1,
        }),
        headers: { 'Content-Type': 'application/json', ...ANNOTATOR_HEADERS },
      });

      const res = await pointPOST(req, { params: Promise.resolve({ id: 'match-doubles-1' }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('INVALID_HITTER');
    });

    it('rejeita ACE atribuído ao lado recebedor em duplas', async () => {
      mockTx.match.findFirst.mockResolvedValue(baseDoublesMatch);

      const req = new NextRequest('http://localhost:3000/api/matches/match-doubles-1/point', {
        method: 'POST',
        body: JSON.stringify({
          winnerId: P2_ID, // player2 está recebendo (sacador inicial é p1 da player1)
          serverId: P1_ID,
          type: 'ACE',
          version: 1,
        }),
        headers: { 'Content-Type': 'application/json', ...ANNOTATOR_HEADERS },
      });

      const res = await pointPOST(req, { params: Promise.resolve({ id: 'match-doubles-1' }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('ACE_WINNER_MUST_BE_SERVER');
    });

    it('grava ponto em duplas com derivação automática de serverId e annotations de duplas', async () => {
      mockTx.match.findFirst.mockResolvedValue(baseDoublesMatch);
      mockTx.pointLog.count.mockResolvedValue(0);
      mockTx.pointLog.findFirst.mockResolvedValue(null);
      mockTx.pointLog.aggregate.mockResolvedValue({ _max: { sequenceNumber: 0 } });
      mockTx.pointLog.create.mockResolvedValue({
        id: 'pl-1',
        matchId: 'match-doubles-1',
        sequenceNumber: 1,
        winnerId: P1_ID,
        serverId: P1_ID,
        type: 'WINNER',
        annotations: {
          hitterId: P1_ID,
          receiverId: P2_ID,
          courtSide: 'deuce',
        },
      });
      mockTx.match.update.mockResolvedValue({
        ...baseDoublesMatch,
        version: 2,
      });

      const req = new NextRequest('http://localhost:3000/api/matches/match-doubles-1/point', {
        method: 'POST',
        body: JSON.stringify({
          winnerId: P1_ID,
          serverId: P1_ID,
          hitterId: P1_ID,
          type: 'WINNER',
          version: 1,
        }),
        headers: { 'Content-Type': 'application/json', ...ANNOTATOR_HEADERS },
      });

      const res = await pointPOST(req, { params: Promise.resolve({ id: 'match-doubles-1' }) });
      expect(res.status).toBe(200);

      // Verifica se o pointLog.create foi chamado com o serverId derivado e as anotações
      expect(mockTx.pointLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            serverId: P1_ID,
            annotations: expect.objectContaining({
              hitterId: P1_ID,
              receiverId: P2_ID,
              courtSide: 'deuce',
            }),
          }),
        })
      );
    });
  });
});
