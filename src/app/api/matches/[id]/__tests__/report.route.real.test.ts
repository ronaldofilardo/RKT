// Teste REAL para impedir regressao - mocks, contratos, Arrange-Act-Assert
import { GET } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/auth', () => ({
  withRLSHandler: jest.fn((req, role, handler) => handler()),
  getRLSUser: jest.fn(() => ({ id: 'user-1', role: 'ATHLETE' })),
}));

jest.mock('@/services/matchService', () => ({
  getMatch: jest.fn(),
  getMatchScoreEdits: jest.fn(),
}));

import { getMatch, getMatchScoreEdits } from '@/services/matchService';

describe('Report Route - Real (Regressao)', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('deve retornar 404 quando partida nao existe', async () => {
    (getMatch as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/test');
    const res = await GET(req, { params: Promise.resolve({ id: 'm1' }) });
    expect(res.status).toBe(404);
  });
});
