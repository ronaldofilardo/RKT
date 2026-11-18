import { NextRequest } from 'next/server';
import { POST } from '../route';
import * as authCredentials from '@/lib/auth-credentials.logic';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/auth-credentials.logic');
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hash-123'),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    guardianLink: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  },
}));

describe('POST /api/guardians/me/dependents/[id]/provision-account', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 401 se não autenticado', async () => {
    (authCredentials.getUserFromRequest as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/guardians/me/dependents/p1/provision-account', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'p1' }) });
    expect(res.status).toBe(401);
  });

  it('retorna 403 se usuário não tem tutela ativa', async () => {
    (authCredentials.getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'g1' });
    (prisma.guardianLink.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/guardians/me/dependents/p1/provision-account', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'p1' }) });
    expect(res.status).toBe(403);
  });

  it('retorna 409 se conta já foi habilitada anteriormente', async () => {
    (authCredentials.getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'g1' });
    (prisma.guardianLink.findFirst as jest.Mock).mockResolvedValue({
      id: 'gl-1',
      player: { id: 'p1', name: 'Junior', userId: 'user-already-exists' },
    });

    const req = new NextRequest('http://localhost:3000/api/guardians/me/dependents/p1/provision-account', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'p1' }) });
    expect(res.status).toBe(409);
  });

  it('cria credencial temporária e retorna 200 com login e senha', async () => {
    (authCredentials.getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'g1' });
    (prisma.guardianLink.findFirst as jest.Mock).mockResolvedValue({
      id: 'gl-1',
      player: { id: 'p1', name: 'Junior Silva', cpf: '12345678909', userId: null },
    });

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      const mockTx = {
        user: { create: jest.fn().mockResolvedValue({ id: 'u-new', email: 'junior@rkt.local' }) },
        player: { update: jest.fn().mockResolvedValue({}) },
        auditLog: { create: jest.fn().mockResolvedValue({}) },
      };
      return callback(mockTx);
    });

    const req = new NextRequest('http://localhost:3000/api/guardians/me/dependents/p1/provision-account', {
      method: 'POST',
      body: JSON.stringify({ email: 'junior@rkt.local' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'p1' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.identifier).toBe('junior@rkt.local');
    expect(json.tempPassword).toBeDefined();
  });
});
