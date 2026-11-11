import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockPrisma = {
  player: { findUnique: jest.fn(), update: jest.fn() },
  membership: { findMany: jest.fn() },
  user: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  passwordResetRequest: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  linkInvite: { create: jest.fn() },
  auditLog: { create: jest.fn() },
  $transaction: jest.fn(),
};

const mockGetAccessUser = jest.fn();

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('@/lib/auth-credentials.logic', () => ({
  getAccessUserFromRequest: (...args: any[]) => mockGetAccessUser(...args),
}));

describe('POST /api/coach/athletes/[id]/regenerate-link', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccessUser.mockResolvedValue({ id: 'u-coach-1', role: 'ANNOTATOR' });
    (mockPrisma.membership.findMany as any).mockResolvedValue([{ ctId: 'ct-1', status: 'ACTIVE' }]);
    (mockPrisma.passwordResetRequest.findFirst as any).mockResolvedValue(null);
    (mockPrisma.passwordResetRequest.create as any).mockResolvedValue({});
    (mockPrisma.linkInvite.create as any).mockResolvedValue({});
    (mockPrisma.user.update as any).mockResolvedValue({});
  });

  it('retorna 401 se o usuário não estiver autenticado', async () => {
    mockGetAccessUser.mockResolvedValue(null);
    const { POST } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/coach/athletes/p-1/regenerate-link', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'p-1' }) });
    expect(res.status).toBe(401);
  });

  it('retorna 404 se o atleta não for encontrado', async () => {
    (mockPrisma.player.findUnique as any).mockResolvedValue(null);
    const { POST } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/coach/athletes/p-nonexistent/regenerate-link', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'p-nonexistent' }) });
    expect(res.status).toBe(404);
  });

  it('retorna 403 se o treinador não tiver vínculo nem mesmo CT do atleta', async () => {
    (mockPrisma.player.findUnique as any).mockResolvedValue({
      id: 'p-outro',
      createdByUserId: 'u-outro',
      playerCts: [{ ctId: 'ct-outro' }],
      coachAthleteLinks: [],
    });
    const { POST } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/coach/athletes/p-outro/regenerate-link', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'p-outro' }) });
    expect(res.status).toBe(403);
  });

  it('gera link com sucesso quando treinador é o criador do atleta', async () => {
    (mockPrisma.player.findUnique as any).mockResolvedValue({
      id: 'p-meu',
      name: 'Atleta Meu',
      createdByUserId: 'u-coach-1',
      userId: 'u-atleta-1',
      user: { id: 'u-atleta-1', email: 'atleta@teste.com' },
      playerCts: [],
      coachAthleteLinks: [],
    });

    const { POST } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/coach/athletes/p-meu/regenerate-link', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'p-meu' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.token).toBeDefined();
    expect(json.expiresAt).toBeDefined();
  });
});
