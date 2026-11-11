import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockPrisma = {
  linkInvite: { create: jest.fn() },
  passwordResetRequest: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  user: { update: jest.fn() },
};

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

describe('issueAthleteFirstAccessLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockPrisma.passwordResetRequest.findFirst as any).mockResolvedValue(null);
    (mockPrisma.passwordResetRequest.create as any).mockResolvedValue({});
    (mockPrisma.linkInvite.create as any).mockResolvedValue({});
    (mockPrisma.user.update as any).mockResolvedValue({});
  });

  it('gera link e atualiza PasswordResetRequest para atleta particular (sem ctId)', async () => {
    const { issueAthleteFirstAccessLink } = await import('../athlete-first-access-link.logic');
    const res = await issueAthleteFirstAccessLink({
      userId: 'u-atleta-1',
      userEmail: 'atleta@teste.com',
      ctId: null,
      issuedByUserId: 'u-coach-1',
    });

    expect(res.token).toBeDefined();
    expect(res.expiresAt).toBeInstanceOf(Date);
    expect(mockPrisma.linkInvite.create).not.toHaveBeenCalled();
    expect(mockPrisma.passwordResetRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'u-atleta-1',
          status: 'LINK_ISSUED',
        }),
      }),
    );
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u-atleta-1' },
        data: expect.objectContaining({ mustChangePassword: true }),
      }),
    );
  });

  it('cria LinkInvite quando ctId é fornecido (atleta de clube)', async () => {
    const { issueAthleteFirstAccessLink } = await import('../athlete-first-access-link.logic');
    const res = await issueAthleteFirstAccessLink({
      userId: 'u-atleta-2',
      userEmail: 'atleta2@teste.com',
      ctId: 'ct-clube-1',
      issuedByUserId: 'u-coach-1',
    });

    expect(res.token).toBeDefined();
    expect(mockPrisma.linkInvite.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ctId: 'ct-clube-1',
          kind: 'ATLETA',
        }),
      }),
    );
  });

  it('atualiza PasswordResetRequest existente se já houver um registro', async () => {
    const { issueAthleteFirstAccessLink } = await import('../athlete-first-access-link.logic');
    (mockPrisma.passwordResetRequest.findFirst as any).mockResolvedValue({ id: 'prr-existente' });
    (mockPrisma.passwordResetRequest.update as any).mockResolvedValue({});

    await issueAthleteFirstAccessLink({
      userId: 'u-atleta-1',
      userEmail: 'atleta@teste.com',
      ctId: null,
    });

    expect(mockPrisma.passwordResetRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'prr-existente' },
        data: expect.objectContaining({ status: 'LINK_ISSUED' }),
      }),
    );
  });
});
