jest.mock('@/lib/prisma', () => ({
  prisma: {
    match: { findFirst: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { closePublicTemplate } from '../match-template-close.logic';

const mockFindFirst = prisma.match.findFirst as jest.MockedFunction<any>;
const mockUpdate = prisma.match.update as jest.MockedFunction<any>;
const mockAuditCreate = prisma.auditLog.create as jest.MockedFunction<any>;

describe('closePublicTemplate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('404 quando a partida não existe', async () => {
    mockFindFirst.mockResolvedValue(null);
    await expect(closePublicTemplate('m-x', 'u-1')).resolves.toMatchObject({ ok: false, status: 404 });
  });

  it('400 quando não é template público', async () => {
    mockFindFirst.mockResolvedValue({ createdByUserId: 'u-1', isPublicTemplate: false, ctId: null });
    await expect(closePublicTemplate('m-1', 'u-1')).resolves.toMatchObject({
      ok: false,
      status: 400,
      error: 'NOT_A_TEMPLATE',
    });
  });

  it('403 quando não é o criador', async () => {
    mockFindFirst.mockResolvedValue({ createdByUserId: 'u-2', isPublicTemplate: true, ctId: null });
    await expect(closePublicTemplate('tpl-1', 'u-1')).resolves.toMatchObject({
      ok: false,
      status: 403,
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('faz soft-delete e audita quando é o criador', async () => {
    mockFindFirst.mockResolvedValue({ createdByUserId: 'u-1', isPublicTemplate: true, ctId: 'ct-1' });
    mockUpdate.mockResolvedValue({ id: 'tpl-1' });

    await expect(closePublicTemplate('tpl-1', 'u-1')).resolves.toEqual({ ok: true });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'tpl-1' },
      data: { deletedAt: expect.any(Date), deletedBy: 'u-1' },
    });
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'MATCH_TEMPLATE_CLOSED', ctId: 'ct-1' }),
      }),
    );
  });
});
