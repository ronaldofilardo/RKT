import { NextRequest } from 'next/server';
import { POST } from '../route';
import * as authCredentials from '@/lib/auth-credentials.logic';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/auth-credentials.logic');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: { create: jest.fn().mockResolvedValue({ id: 'log-1' }) },
  },
}));

describe('POST /api/coach/particular/accept-terms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 401 se não autenticado', async () => {
    (authCredentials.getUserFromRequest as jest.Mock).mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/coach/particular/accept-terms', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('registra aceite no AuditLog e retorna 200', async () => {
    (authCredentials.getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'u1' });
    const req = new NextRequest('http://localhost:3000/api/coach/particular/accept-terms', {
      method: 'POST',
      headers: { 'user-agent': 'Jest-Agent' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorUserId: 'u1',
          action: 'COACH_ECA_TERMS_ACCEPTED',
        }),
      }),
    );
  });
});
