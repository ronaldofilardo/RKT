import { NextRequest } from 'next/server';
import { POST } from '@/app/api/matches/route';
import { prisma } from '@/lib/prisma';
import { createToken } from '@tests/helpers/auth';

jest.mock('@/lib/prisma', () => {
  const txMock = {
    match: {
      create: jest.fn(),
    },
  };
  const prismaMock = {
    match: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((cb: any) => cb(txMock)),
    __txMock: txMock,
  };
  return { prisma: prismaMock };
});

jest.mock('@/services/matchSuggestionService', () => ({
  findDuplicateMatch: jest.fn().mockResolvedValue(null),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const txMock = (mockPrisma as any).__txMock;

describe('POST /api/matches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 401 sem token', async () => {
    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
      }),
    });
    const response = await POST(req);
    
    expect(response.status).toBe(401);
  });

  it('deve criar partida com createdByUserId do usuário logado', async () => {
    const userId = 'user-123';
    const token = await createToken(userId, 'ATHLETE');
    
    const matchData = {
      player1Id: 'p1',
      player2Id: 'p2',
      format: 'BEST_OF_3',
      sportType: 'TENNIS',
    };

    txMock.match.create.mockResolvedValue({
      id: 'match-1',
      ...matchData,
      createdByUserId: userId,
    });

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      headers: { 
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(matchData),
    });

    const response = await POST(req);
    
    expect(response.status).toBe(201);
    
    // Verifica se o createdByUserId foi passado corretamente (via tx, não prisma)
    expect(txMock.match.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdByUserId: userId,
        }),
      })
    );

    const data = await response.json();
    expect(data.data.createdByUserId).toBe(userId);
  });

  it('deve retornar 401 se token tiver sub vazio (RLS validation)', async () => {
    const token = await createToken('', 'ATHLETE');
    
    const matchData = {
      player1Id: 'p1',
      player2Id: 'p2',
      format: 'BEST_OF_3',
    };

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      headers: { 
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(matchData),
    });

    const response = await POST(req);
    
    // RLS validation rejects empty user id
    expect(response.status).toBe(401);
  });

  it('deve retornar 400 se dados inválidos', async () => {
    const token = await createToken('user-123', 'ATHLETE');

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      headers: { 
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ invalid: 'data' }),
    });

    const response = await POST(req);
    
    expect(response.status).toBe(400);
  });

  it('deve retornar 409 se partida duplicada', async () => {
    const token = await createToken('user-123', 'ATHLETE');
    
    const { findDuplicateMatch } = await import('@/services/matchSuggestionService');
    (findDuplicateMatch as jest.Mock).mockResolvedValue({
      id: 'existing-match',
      player1: { name: 'Player 1' },
      player2: { name: 'Player 2' },
    });

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      headers: { 
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        player1Id: 'p1',
        player2Id: 'p2',
        format: 'BEST_OF_3',
      }),
    });

    const response = await POST(req);
    
    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error).toBe('CONFLICT');
  });
});