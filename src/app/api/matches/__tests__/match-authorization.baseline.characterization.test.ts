/**
 * Testes Canônicos de Autorização em Partidas e IDOR Protection
 *
 * Atualizado pós-migração para Role enum ADMIN | ANNOTATOR (2026-09-13):
 * - ADMIN é bloqueado de acessar partidas de anotadores (403 sempre)
 * - ANNOTATOR só vê partidas onde é criador ou participante (player1/player2)
 * - Validação de IDOR: bloqueio de visualização para anotador não-criador em partida privada
 *
 * Estes são characterization tests — documentam o comportamento OBSERVADO.
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/matches/[id]/route';
import { prisma } from '@/lib/prisma';
import { createToken } from '@tests/helpers/auth';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    match: {
      findFirst: jest.fn(),
    },
    pointLog: {
      aggregate: jest.fn().mockResolvedValue({ _max: { sequenceNumber: null } }),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Match Authorization Specification Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/matches/[id] - Regras de Visualização', () => {
    const publicMatchData = {
      id: 'match-xyz',
      player1Id: 'athlete-1',
      player2Id: 'athlete-2',
      createdByUserId: 'annotator-1',
      state: 'IN_PROGRESS',
      format: 'BEST_OF_3',
      sportType: 'TENNIS',
      courtType: null,
      scheduledAt: null,
      startedAt: null,
      finishedAt: null,
      nickname: null,
      visibility: 'PUBLIC',
      isResuming: false,
      openForAnnotation: true,
      tournamentName: 'Torneio Aberto',
      category: null,
      round: null,
      bracketType: null,
      temperature: null,
      humidity: null,
      version: 1,
      scoreState: null,
      initialServerId: 'athlete-1',
      player1: { id: 'athlete-1', name: 'Atleta Um' },
      player2: { id: 'athlete-2', name: 'Atleta Dois' },
      _count: { pointLog: 0 },
    };

    const privateMatchData = {
      ...publicMatchData,
      id: 'match-private',
      visibility: 'PRIVATE',
    };

    it('ANNOTATOR criador da partida recebe 200 em partida pública', async () => {
      const creatorToken = await createToken('annotator-1', 'ANNOTATOR');
      (mockPrisma.match.findFirst as any).mockResolvedValue(publicMatchData);

      const req = new NextRequest('http://localhost:3000/api/matches/match-xyz', {
        headers: { authorization: `Bearer ${creatorToken}` },
      });

      const response = await GET(req, { params: Promise.resolve({ id: 'match-xyz' }) });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe('match-xyz');
    });

    it('ADMIN recebe 403 sempre — bloqueado de acessar partidas', async () => {
      const adminToken = await createToken('admin-global', 'ADMIN');

      const req = new NextRequest('http://localhost:3000/api/matches/match-xyz', {
        headers: { authorization: `Bearer ${adminToken}` },
      });

      const response = await GET(req, { params: Promise.resolve({ id: 'match-xyz' }) });
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('FORBIDDEN');
    });

    it('ANNOTATOR não-criador recebe 404 em partida pública (RLS-like filtering)', async () => {
      const otherToken = await createToken('annotator-2', 'ANNOTATOR');
      // findFirst retorna null porque o WHERE inclui createdByUserId/user.id
      (mockPrisma.match.findFirst as any).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/matches/match-xyz', {
        headers: { authorization: `Bearer ${otherToken}` },
      });

      const response = await GET(req, { params: Promise.resolve({ id: 'match-xyz' }) });
      expect(response.status).toBe(404);
    });

    it('deve retornar 404 para anotador não-criador tentando acessar partida PRIVATE', async () => {
      const externalToken = await createToken('annotator-estranho', 'ANNOTATOR');
      // findFirst retorna null porque WHERE requer createdByUserId ou player1/player2
      (mockPrisma.match.findFirst as any).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/matches/match-private', {
        headers: { authorization: `Bearer ${externalToken}` },
      });

      const response = await GET(req, { params: Promise.resolve({ id: 'match-private' }) });
      expect(response.status).toBe(404);
    });

    it('ANNOTATOR criador recebe 200 em partida PRIVATE', async () => {
      const creatorToken = await createToken('annotator-1', 'ANNOTATOR');
      (mockPrisma.match.findFirst as any).mockResolvedValue(privateMatchData);

      const req = new NextRequest('http://localhost:3000/api/matches/match-private', {
        headers: { authorization: `Bearer ${creatorToken}` },
      });

      const response = await GET(req, { params: Promise.resolve({ id: 'match-private' }) });
      expect(response.status).toBe(200);
      const match = await response.json();
      expect(match.id).toBe('match-private');
    });

    it('ANNOTATOR player1 recebe 403 se não é o criador da partida PRIVATE', async () => {
      const p1Token = await createToken('athlete-1', 'ANNOTATOR');
      (mockPrisma.match.findFirst as any).mockResolvedValue(privateMatchData);

      const req = new NextRequest('http://localhost:3000/api/matches/match-private', {
        headers: { authorization: `Bearer ${p1Token}` },
      });

      const response = await GET(req, { params: Promise.resolve({ id: 'match-private' }) });
      expect(response.status).toBe(403);
    });
  });
});
