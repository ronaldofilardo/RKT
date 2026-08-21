// Boas praticas: Arrange-Act-Assert, mocks para dependencias externas (withRLSHandler, prisma)
import { GET, POST, DELETE } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/auth', () => ({
  withRLSHandler: jest.fn((req, role, handler) => handler()),
  getRLSUser: jest.fn(() => ({ id: 'user-1', role: 'ATHLETE' })),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    pointLog: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('Audio Route - Testes Reais para Impedir Regressao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/matches/[id]/point/[pointId]/audio', () => {
    it('deve retornar 404 quando audio nao existe', async () => {
      // Arrange
      (prisma.pointLog.findFirst as jest.Mock).mockResolvedValue(null);
      const req = new NextRequest('http://localhost:3000/api/test');

      // Act
      const res = await GET(req, { params: Promise.resolve({ id: 'm1', pointId: 'p1' }) });

      // Assert
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/matches/[id]/point/[pointId]/audio', () => {
    it('deve validar multipart/form-data', async () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });
      const res = await POST(req, { params: Promise.resolve({ id: 'm1', pointId: 'p1' }) });
      expect(res.status).toBe(400);
    });
  });
});
