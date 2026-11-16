jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { update: jest.fn() },
    auditLog: { create: jest.fn() },
  },
}));

jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: jest.fn((_req, _roles, _scope, handler) =>
    handler({ user: { id: 'u-guardian' }, actor: { canOperate: false } })
  ),
}));

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { POST } from '../route';

describe('POST /api/guardians/me/upgrade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('atualiza canOperate para true e registra log de auditoria', async () => {
    ((prisma as any).user.update as jest.Mock).mockResolvedValue({ id: 'u-guardian', canOperate: true });

    const req = new NextRequest('http://localhost/api/guardians/me/upgrade', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.canOperate).toBe(true);
    expect((prisma as any).user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u-guardian' }, data: { canOperate: true } })
    );
    expect((prisma as any).auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'GUARDIAN_UPGRADED_TO_SPECTATOR' }) })
    );
  });
});
