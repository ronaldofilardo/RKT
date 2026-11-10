import { describe, it, expect, beforeEach } from '@jest/globals';
import { assignCoachToTemplate } from '@/services/match-assign.logic';
import { prisma } from '@/lib/prisma';
import type { Actor } from '@/core/access';

jest.mock('@/lib/prisma', () => {
  const txMock = {
    match: { update: jest.fn() },
    auditLog: { create: jest.fn() },
    notification: { create: jest.fn() },
  };
  return {
    prisma: {
      match: { findFirst: jest.fn() },
      membership: { findFirst: jest.fn() },
      $transaction: jest.fn((cb: any) => cb(txMock)),
      __txMock: txMock,
    },
  };
});

const mockPrisma = prisma as any;
const txMock = mockPrisma.__txMock;

describe('assignCoachToTemplate', () => {
  const gestorActor: Actor = {
    userId: 'gestor-1',
    isActive: true,
    canOperate: true,
    memberships: [{ kind: 'GESTOR', ctId: 'ct-1', status: 'ACTIVE', preset: null }],
    athletePlayerId: null,
    athleteCtIds: [],
    guardianOfPlayerIds: [],
    followedPlayerIds: [],
  };

  const coachActor: Actor = {
    userId: 'coach-1',
    isActive: true,
    canOperate: true,
    memberships: [{ kind: 'TREINADOR', ctId: 'ct-1', status: 'ACTIVE', preset: null }],
    athletePlayerId: null,
    athleteCtIds: [],
    guardianOfPlayerIds: [],
    followedPlayerIds: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Gestor designa treinador do próprio CT com sucesso', async () => {
    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'template-1',
      isPublicTemplate: true,
      assignedCoachId: null,
      player1: { name: 'Player 1' },
      player2: { name: 'Player 2' },
    });
    mockPrisma.membership.findFirst.mockResolvedValue({
      id: 'mem-coach',
      userId: 'coach-1',
      ctId: 'ct-1',
      status: 'ACTIVE',
    });
    txMock.match.update.mockResolvedValue({
      id: 'template-1',
      assignedCoachId: 'coach-1',
    });

    const result = await assignCoachToTemplate(gestorActor, 'Gestor Silva', 'template-1', 'coach-1');

    expect(result).toEqual({ matchId: 'template-1', assignedCoachId: 'coach-1' });
    expect(txMock.match.update).toHaveBeenCalledWith({
      where: { id: 'template-1' },
      data: { assignedCoachId: 'coach-1' },
    });
    expect(txMock.notification.create).toHaveBeenCalledTimes(1);
    expect(txMock.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it('Lança 403 se o ator não for gestor', async () => {
    await expect(
      assignCoachToTemplate(coachActor, 'Treinador', 'template-1', 'coach-2'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('Lança 404 se template não existir ou não for público', async () => {
    mockPrisma.match.findFirst.mockResolvedValue(null);

    await expect(
      assignCoachToTemplate(gestorActor, 'Gestor', 'non-existent', 'coach-1'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('Lança 403 se o treinador não pertencer ao CT do gestor', async () => {
    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'template-1',
      isPublicTemplate: true,
      assignedCoachId: null,
    });
    mockPrisma.membership.findFirst.mockResolvedValue(null);

    await expect(
      assignCoachToTemplate(gestorActor, 'Gestor', 'template-1', 'coach-other-ct'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('Lança 409 se template já tiver outro treinador designado', async () => {
    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'template-1',
      isPublicTemplate: true,
      assignedCoachId: 'coach-existing',
      player1: { name: 'P1' },
      player2: { name: 'P2' },
    });
    mockPrisma.membership.findFirst.mockResolvedValue({
      id: 'mem-coach',
      userId: 'coach-new',
      ctId: 'ct-1',
      status: 'ACTIVE',
    });

    await expect(
      assignCoachToTemplate(gestorActor, 'Gestor', 'template-1', 'coach-new'),
    ).rejects.toMatchObject({ status: 409 });
  });
});

