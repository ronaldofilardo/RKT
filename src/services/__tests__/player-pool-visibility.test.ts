jest.mock('@/lib/prisma', () => ({
  prisma: {
    player: { findUnique: jest.fn(), update: jest.fn() },
    consentRecord: { findFirst: jest.fn() },
    auditLog: { create: jest.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import {
  evaluatePoolVisibility,
  setPlayerPoolVisibility,
} from '../player-pool-visibility.logic';

const mockFindUnique = prisma.player.findUnique as jest.MockedFunction<any>;
const mockUpdate = prisma.player.update as jest.MockedFunction<any>;
const mockConsentFindFirst = prisma.consentRecord.findFirst as jest.MockedFunction<any>;
const mockAuditCreate = prisma.auditLog.create as jest.MockedFunction<any>;

const now = new Date('2026-11-09T12:00:00Z');

describe('evaluatePoolVisibility', () => {
  it('permite o próprio atleta adulto', () => {
    expect(evaluatePoolVisibility({ isOwner: true, isPlatformStaff: false, visible: true, minor: false, hasConsent: false }))
      .toEqual({ allowed: true });
  });

  it('permite ADMIN/SUPORTE', () => {
    expect(evaluatePoolVisibility({ isOwner: false, isPlatformStaff: true, visible: true, minor: false, hasConsent: false }))
      .toEqual({ allowed: true });
  });

  it('nega terceiros sem vínculo', () => {
    expect(evaluatePoolVisibility({ isOwner: false, isPlatformStaff: false, visible: true, minor: false, hasConsent: false }))
      .toEqual({ allowed: false, error: 'FORBIDDEN' });
  });

  it('exige consentimento para menor ao ligar a visibilidade', () => {
    expect(evaluatePoolVisibility({ isOwner: true, isPlatformStaff: false, visible: true, minor: true, hasConsent: false }))
      .toEqual({ allowed: false, error: 'CONSENT_REQUIRED' });
    expect(evaluatePoolVisibility({ isOwner: true, isPlatformStaff: false, visible: true, minor: true, hasConsent: true }))
      .toEqual({ allowed: true });
  });

  it('permite menor desligar a visibilidade sem consentimento', () => {
    expect(evaluatePoolVisibility({ isOwner: true, isPlatformStaff: false, visible: false, minor: true, hasConsent: false }))
      .toEqual({ allowed: true });
  });
});

describe('setPlayerPoolVisibility', () => {
  beforeEach(() => jest.clearAllMocks());

  it('404 quando o atleta não existe', async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(setPlayerPoolVisibility({
      playerId: 'p-x', actorUserId: 'u-1', isPlatformStaff: false, visible: true, now,
    })).resolves.toMatchObject({ ok: false, status: 404, error: 'NOT_FOUND' });
  });

  it('403 sem permissão', async () => {
    mockFindUnique.mockResolvedValue({ id: 'p-1', userId: 'other', birthDate: new Date('1990-01-01') });

    await expect(setPlayerPoolVisibility({
      playerId: 'p-1', actorUserId: 'u-1', isPlatformStaff: false, visible: true, now,
    })).resolves.toMatchObject({ ok: false, status: 403, error: 'FORBIDDEN' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('403 CONSENT_REQUIRED para menor sem consentimento', async () => {
    mockFindUnique.mockResolvedValue({ id: 'p-1', userId: 'u-1', birthDate: new Date('2012-01-01') });
    mockConsentFindFirst.mockResolvedValue(null);

    await expect(setPlayerPoolVisibility({
      playerId: 'p-1', actorUserId: 'u-1', isPlatformStaff: false, visible: true, now,
    })).resolves.toMatchObject({ ok: false, status: 403, error: 'CONSENT_REQUIRED' });
  });

  it('liga a visibilidade com timestamp e auditoria', async () => {
    mockFindUnique.mockResolvedValue({ id: 'p-1', userId: 'u-1', birthDate: new Date('1990-01-01') });
    mockUpdate.mockResolvedValue({ poolVisible: true, poolVisibleSince: now });

    const result = await setPlayerPoolVisibility({
      playerId: 'p-1', actorUserId: 'u-1', isPlatformStaff: false, visible: true, now,
    });

    expect(result).toEqual({ ok: true, poolVisible: true, poolVisibleSince: now });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'p-1' },
      data: { poolVisible: true, poolVisibleSince: now },
      select: { poolVisible: true, poolVisibleSince: true },
    });
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'PLAYER_POOL_VISIBILITY_ENABLED' }) }),
    );
  });

  it('desliga a visibilidade limpando o timestamp', async () => {
    mockFindUnique.mockResolvedValue({ id: 'p-1', userId: 'u-1', birthDate: new Date('1990-01-01') });
    mockUpdate.mockResolvedValue({ poolVisible: false, poolVisibleSince: null });

    await setPlayerPoolVisibility({
      playerId: 'p-1', actorUserId: 'u-1', isPlatformStaff: false, visible: false, now,
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { poolVisible: false, poolVisibleSince: null } }),
    );
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'PLAYER_POOL_VISIBILITY_DISABLED' }) }),
    );
  });
});
