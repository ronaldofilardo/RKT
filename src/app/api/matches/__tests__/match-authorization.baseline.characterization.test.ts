/**
 * Testes Canônicos de Autorização em Partidas e IDOR Protection
 * 
 * Atualizado pós-correção P0 (2026-09-11):
 * - TD-052: Liberação de leitura em partidas públicas e para staff (Admin/Gestor/Coach)
 * - Validação de IDOR: bloqueio de visualização para atleta avulso em partida privada
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
      createdByUserId: 'gestor-1',
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

    it('TD-052 Corrigido: COACH anotador recebe 200 em partida pública', async () => {
      const coachToken = await createToken('coach-terceiro', 'COACH');
      (mockPrisma.match.findFirst as any).mockResolvedValue(publicMatchData);

      const req = new NextRequest('http://localhost:3000/api/matches/match-xyz', {
        headers: { authorization: `Bearer ${coachToken}` },
      });

      const response = await GET(req, { params: Promise.resolve({ id: 'match-xyz' }) });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe('match-xyz');
    });

    it('TD-052 Corrigido: ADMIN recebe 200 em GET /api/matches/[id]', async () => {
      const adminToken = await createToken('admin-global', 'ADMIN');
      (mockPrisma.match.findFirst as any).mockResolvedValue(publicMatchData);

      const req = new NextRequest('http://localhost:3000/api/matches/match-xyz', {
        headers: { authorization: `Bearer ${adminToken}` },
      });

      const response = await GET(req, { params: Promise.resolve({ id: 'match-xyz' }) });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe('match-xyz');
    });

    it('TD-052 Corrigido: Qualquer usuário autenticado pode ver partida com visibility PUBLIC', async () => {
      const spectatorToken = await createToken('espectador-1', 'SPECTATOR');
      (mockPrisma.match.findFirst as any).mockResolvedValue(publicMatchData);

      const req = new NextRequest('http://localhost:3000/api/matches/match-xyz', {
        headers: { authorization: `Bearer ${spectatorToken}` },
      });

      const response = await GET(req, { params: Promise.resolve({ id: 'match-xyz' }) });
      expect(response.status).toBe(200);
    });

    it('deve retornar 403 para usuário avulso tentando acessar partida PRIVATE', async () => {
      const externalAthleteToken = await createToken('athlete-estranho', 'ATHLETE');
      (mockPrisma.match.findFirst as any).mockResolvedValue(privateMatchData);

      const req = new NextRequest('http://localhost:3000/api/matches/match-private', {
        headers: { authorization: `Bearer ${externalAthleteToken}` },
      });

      const response = await GET(req, { params: Promise.resolve({ id: 'match-private' }) });
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('FORBIDDEN');
    });

    it('deve permitir acesso para o criador da partida mesmo se for PRIVATE', async () => {
      const creatorToken = await createToken('gestor-1', 'GESTOR');
      (mockPrisma.match.findFirst as any).mockResolvedValue(privateMatchData);

      const req = new NextRequest('http://localhost:3000/api/matches/match-private', {
        headers: { authorization: `Bearer ${creatorToken}` },
      });

      const response = await GET(req, { params: Promise.resolve({ id: 'match-private' }) });
      expect(response.status).toBe(200);
      const match = await response.json();
      expect(match.id).toBe('match-private');
    });

    it('deve permitir acesso para os atletas participantes mesmo se for PRIVATE', async () => {
      const p1Token = await createToken('athlete-1', 'ATHLETE');
      (mockPrisma.match.findFirst as any).mockResolvedValue(privateMatchData);

      const req = new NextRequest('http://localhost:3000/api/matches/match-private', {
        headers: { authorization: `Bearer ${p1Token}` },
      });

      const response = await GET(req, { params: Promise.resolve({ id: 'match-private' }) });
      expect(response.status).toBe(200);
      const match = await response.json();
      expect(match.id).toBe('match-private');
    });
  });
});
