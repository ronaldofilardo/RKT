import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  passwordResetRequest: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: jest.fn((req, perm, ctx, handler: any) =>
    handler({ user: { id: 'u-support-1', role: 'ANNOTATOR' }, actor: { id: 'u-support-1', roles: ['SUPORTE'] } }),
  ),
}));
jest.mock('@/core/access', () => ({
  getProfiles: jest.fn().mockReturnValue(['SUPORTE']),
}));
jest.mock('@/app/api/support/access-requests/support-access.logic', () => ({
  isProtectedTarget: jest.fn(),
}));

describe('POST /api/support/password-resets', () => {
  let isProtectedTargetMock: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const supportLogic = await import('@/app/api/support/access-requests/support-access.logic');
    isProtectedTargetMock = supportLogic.isProtectedTarget;
  });

  it('gera link de reset para gestor com sucesso', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u-gestor-1',
      email: 'gestor@clube.com',
      name: 'Gestor Teste',
    } as any);

    isProtectedTargetMock.mockResolvedValue(false);
    mockPrisma.passwordResetRequest.findFirst.mockResolvedValue(null);
    mockPrisma.passwordResetRequest.create.mockResolvedValue({ id: 'pr-1' } as any);
    mockPrisma.user.update.mockResolvedValue({ id: 'u-gestor-1' } as any);
    mockPrisma.auditLog.create.mockResolvedValue({ id: 'al-1' } as any);

    const { POST } = await import('../password-resets/route');
    const req = new NextRequest('http://localhost:3000/api/support/password-resets', {
      method: 'POST',
      body: JSON.stringify({ userId: 'u-gestor-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.token).toBeDefined();
    expect(json.expiresAt).toBeDefined();

    expect(mockPrisma.passwordResetRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'u-gestor-1',
          status: 'LINK_ISSUED',
        }),
      }),
    );
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u-gestor-1' },
        data: expect.objectContaining({
          mustChangePassword: true,
        }),
      }),
    );
  });

  it('bloqueia reset de contas protegidas por suporte comum', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u-admin-1',
      email: 'admin@rkt.com',
    } as any);

    isProtectedTargetMock.mockResolvedValue(true);

    const { POST } = await import('../password-resets/route');
    const req = new NextRequest('http://localhost:3000/api/support/password-resets', {
      method: 'POST',
      body: JSON.stringify({ userId: 'u-admin-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('TARGET_NOT_ELIGIBLE');
  });
});

