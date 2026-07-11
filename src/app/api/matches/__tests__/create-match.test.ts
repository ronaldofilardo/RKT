import { NextRequest } from 'next/server';
import { POST } from '@/app/api/matches/route';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    match: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('@/services/matchSuggestionService', () => ({
  findDuplicateMatch: jest.fn().mockResolvedValue(null),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'test-secret');

async function createToken(userId: string, role: string) {
  return new SignJWT({ sub: userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(JWT_SECRET);
}

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

    mockPrisma.match.create.mockResolvedValue({
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
    
    // Verifica se o createdByUserId foi passado corretamente
    expect(mockPrisma.match.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdByUserId: userId,
        }),
      })
    );

    const data = await response.json();
    expect(data.createdByUserId).toBe(userId);
  });

  it('deve criar partida sem createdByUserId se token não tiver sub', async () => {
    const token = await createToken('', 'ATHLETE');
    
    const matchData = {
      player1Id: 'p1',
      player2Id: 'p2',
      format: 'BEST_OF_3',
    };

    mockPrisma.match.create.mockResolvedValue({
      id: 'match-1',
      ...matchData,
      createdByUserId: null,
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
    expect(data.error).toBe('DUPLICATE_MATCH');
  });
});