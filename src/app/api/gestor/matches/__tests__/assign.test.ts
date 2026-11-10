import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { POST } from '../[id]/assign/route';

jest.mock('@/lib/prisma', () => {
  const txMock = {
    match: { update: jest.fn() },
    auditLog: { create: jest.fn() },
    notification: { create: jest.fn() },
  };
  return {
    prisma: {
      match: { findUnique: jest.fn() },
      membership: { findFirst: jest.fn() },
      $transaction: jest.fn((cb: any) => cb(txMock)),
      __txMock: txMock,
    },
  };
});

jest.mock('../../_logic', () => ({
  getGestorCtId: jest.fn().mockResolvedValue('ct-1'),
  denyGestor: jest.fn(),
}));

jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: jest.fn(async (_req, _action, _res, handler) => {
    return handler({
      user: { id: 'gestor-1', name: 'Gestor Silva', role: 'GESTOR' },
      actor: { userId: 'gestor-1', isActive: true, canOperate: true, memberships: [] },
    });
  }),
}));

const mockPrisma = prisma as any;
const txMock = mockPrisma.__txMock;

describe('POST /api/gestor/matches/[id]/assign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('designa treinador do CT para a partida com sucesso', async () => {
    mockPrisma.match.findUnique.mockResolvedValue({
      id: 'm-1',
      ctId: 'ct-1',
      player1: { name: 'P1' },
      player2: { name: 'P2' },
    });
    mockPrisma.membership.findFirst.mockResolvedValue({
      id: 'mem-1',
      userId: 'coach-1',
      ctId: 'ct-1',
      status: 'ACTIVE',
    });
    txMock.match.update.mockResolvedValue({
      id: 'm-1',
      assignedCoachId: 'coach-1',
    });

    const req = new NextRequest('http://localhost:3000/api/gestor/matches/m-1/assign', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ coachUserId: 'coach-1' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: 'm-1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ matchId: 'm-1', assignedCoachId: 'coach-1' });
    expect(txMock.match.update).toHaveBeenCalledWith({
      where: { id: 'm-1' },
      data: { assignedCoachId: 'coach-1' },
    });
  });

  it('retorna 404 se a partida não existir', async () => {
    mockPrisma.match.findUnique.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/gestor/matches/m-x/assign', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ coachUserId: 'coach-1' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: 'm-x' }) });
    expect(res.status).toBe(404);
  });

  it('retorna 403 se o treinador não pertencer ao CT do gestor', async () => {
    mockPrisma.match.findUnique.mockResolvedValue({
      id: 'm-1',
      ctId: 'ct-1',
    });
    mockPrisma.membership.findFirst.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/gestor/matches/m-1/assign', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ coachUserId: 'coach-other' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: 'm-1' }) });
    expect(res.status).toBe(403);
  });
});

