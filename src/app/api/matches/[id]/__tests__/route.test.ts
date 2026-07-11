import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/matches/[id]/route';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    match: {
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('@/services/matchService', () => ({
  deleteMatch: jest.fn(),
  updateMatch: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const { deleteMatch } = require('@/services/matchService');

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'test-secret');

async function createToken(userId: string, role: string) {
  return new SignJWT({ sub: userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(JWT_SECRET);
}

describe('GET /api/matches/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 401 sem token', async () => {
    const req = new NextRequest('http://localhost:3000/api/matches/test-id');
    const response = await GET(req, { params: Promise.resolve({ id: 'test-id' }) });
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('UNAUTHORIZED');
  });

  it('deve retornar 401 com token inválido', async () => {
    const req = new NextRequest('http://localhost:3000/api/matches/test-id', {
      headers: { authorization: 'Bearer invalid-token' },
    });
    const response = await GET(req, { params: Promise.resolve({ id: 'test-id' }) });
    
    expect(response.status).toBe(401);
  });

  it('deve retornar 404 para partida inexistente', async () => {
    const token = await createToken('user1', 'ATHLETE');
    mockPrisma.match.findFirst.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/matches/test-id', {
      headers: { authorization: `Bearer ${token}` },
    });
    const response = await GET(req, { params: Promise.resolve({ id: 'test-id' }) });
    
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('MATCH_NOT_FOUND');
  });

  it('deve retornar 403 se usuário não tem acesso à partida', async () => {
    const token = await createToken('user1', 'ATHLETE');
    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'test-id',
      player1Id: 'user2',
      player2Id: 'user3',
      createdByUserId: 'user4',
      state: 'SCHEDULED',
      format: 'BEST_OF_3',
      sportType: 'TENNIS',
      courtType: null,
      scheduledAt: null,
      startedAt: null,
      finishedAt: null,
      nickname: null,
      visibility: 'PUBLIC',
      isResuming: false,
      openForAnnotation: false,
      tournamentName: null,
      category: null,
      includeLet: null,
      round: null,
      bracketType: null,
      temperature: null,
      humidity: null,
      version: 0,
      scoreState: null,
      initialServerId: null,
      player1: { id: 'user2', name: 'Player 1' },
      player2: { id: 'user3', name: 'Player 2' },
    });

    const req = new NextRequest('http://localhost:3000/api/matches/test-id', {
      headers: { authorization: `Bearer ${token}` },
    });
    const response = await GET(req, { params: Promise.resolve({ id: 'test-id' }) });
    
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('FORBIDDEN');
  });

  it('deve retornar partida se usuário é player1', async () => {
    const token = await createToken('user1', 'ATHLETE');
    const matchData = {
      id: 'test-id',
      player1Id: 'user1',
      player2Id: 'user2',
      createdByUserId: 'user1',
      state: 'SCHEDULED',
      format: 'BEST_OF_3',
      sportType: 'TENNIS',
      courtType: null,
      scheduledAt: null,
      startedAt: null,
      finishedAt: null,
      nickname: null,
      visibility: 'PUBLIC',
      isResuming: false,
      openForAnnotation: false,
      tournamentName: null,
      category: null,
      includeLet: null,
      round: null,
      bracketType: null,
      temperature: null,
      humidity: null,
      version: 0,
      scoreState: null,
      initialServerId: null,
      player1: { id: 'user1', name: 'Player 1' },
      player2: { id: 'user2', name: 'Player 2' },
    };
    mockPrisma.match.findFirst.mockResolvedValue(matchData);

    const req = new NextRequest('http://localhost:3000/api/matches/test-id', {
      headers: { authorization: `Bearer ${token}` },
    });
    const response = await GET(req, { params: Promise.resolve({ id: 'test-id' }) });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe('test-id');
  });

  it('deve retornar partida se usuário é player2', async () => {
    const token = await createToken('user2', 'ATHLETE');
    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'test-id',
      player1Id: 'user1',
      player2Id: 'user2',
      createdByUserId: 'user1',
      state: 'SCHEDULED',
      format: 'BEST_OF_3',
      sportType: 'TENNIS',
      player1: { id: 'user1', name: 'Player 1' },
      player2: { id: 'user2', name: 'Player 2' },
    });

    const req = new NextRequest('http://localhost:3000/api/matches/test-id', {
      headers: { authorization: `Bearer ${token}` },
    });
    const response = await GET(req, { params: Promise.resolve({ id: 'test-id' }) });
    
    expect(response.status).toBe(200);
  });

  it('deve retornar partida se usuário é o criador', async () => {
    const token = await createToken('user1', 'ATHLETE');
    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'test-id',
      player1Id: 'user2',
      player2Id: 'user3',
      createdByUserId: 'user1',
      state: 'SCHEDULED',
      format: 'BEST_OF_3',
      sportType: 'TENNIS',
      player1: { id: 'user2', name: 'Player 1' },
      player2: { id: 'user3', name: 'Player 2' },
    });

    const req = new NextRequest('http://localhost:3000/api/matches/test-id', {
      headers: { authorization: `Bearer ${token}` },
    });
    const response = await GET(req, { params: Promise.resolve({ id: 'test-id' }) });
    
    expect(response.status).toBe(200);
  });
});

describe('DELETE /api/matches/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    deleteMatch.mockReset();
  });

  it('deve retornar 401 sem token', async () => {
    const req = new NextRequest('http://localhost:3000/api/matches/test-id', {
      method: 'DELETE',
    });
    const response = await DELETE(req, { params: Promise.resolve({ id: 'test-id' }) });
    
    expect(response.status).toBe(401);
  });

  it('deve retornar 401 com token inválido', async () => {
    const req = new NextRequest('http://localhost:3000/api/matches/test-id', {
      method: 'DELETE',
      headers: { authorization: 'Bearer invalid-token' },
    });
    const response = await DELETE(req, { params: Promise.resolve({ id: 'test-id' }) });
    
    expect(response.status).toBe(401);
  });

  it('deve retornar 404 para partida inexistente', async () => {
    const token = await createToken('user1', 'ATHLETE');
    mockPrisma.match.findFirst.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/matches/test-id?type=soft', {
      method: 'DELETE',
      headers: { authorization: `Bearer ${token}` },
    });
    const response = await DELETE(req, { params: Promise.resolve({ id: 'test-id' }) });
    
    expect(response.status).toBe(404);
  });

  it('deve retornar 403 se usuário não é o criador', async () => {
    const token = await createToken('user1', 'ATHLETE');
    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'test-id',
      createdByUserId: 'user2',
    });

    const req = new NextRequest('http://localhost:3000/api/matches/test-id?type=soft', {
      method: 'DELETE',
      headers: { authorization: `Bearer ${token}` },
    });
    const response = await DELETE(req, { params: Promise.resolve({ id: 'test-id' }) });
    
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('FORBIDDEN');
    expect(data.message).toContain('Apenas o criador');
  });

  it('deve permitir soft delete se usuário é o criador', async () => {
    const token = await createToken('user1', 'ATHLETE');
    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'test-id',
      createdByUserId: 'user1',
    });
    deleteMatch.mockResolvedValue({ success: true, type: 'soft' });

    const req = new NextRequest('http://localhost:3000/api/matches/test-id?type=soft', {
      method: 'DELETE',
      headers: { authorization: `Bearer ${token}` },
    });
    const response = await DELETE(req, { params: Promise.resolve({ id: 'test-id' }) });
    
    expect(response.status).toBe(200);
    expect(deleteMatch).toHaveBeenCalledWith('test-id', expect.objectContaining({
      type: 'soft',
      deletedBy: 'user1',
    }));
  });

  it('deve validar parâmetro type', async () => {
    const token = await createToken('user1', 'ATHLETE');
    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'test-id',
      createdByUserId: 'user1',
    });

    const req = new NextRequest('http://localhost:3000/api/matches/test-id?type=invalid', {
      method: 'DELETE',
      headers: { authorization: `Bearer ${token}` },
    });
    const response = await DELETE(req, { params: Promise.resolve({ id: 'test-id' }) });
    
    expect(response.status).toBe(400);
  });
});