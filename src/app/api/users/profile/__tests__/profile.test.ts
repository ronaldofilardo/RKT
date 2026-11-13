import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

let mockActorContext: any = {
  user: { id: 'user-1' },
  actor: { userId: 'user-1', athletePlayerId: null },
};

const mockPrisma: any = {
  player: { findUnique: jest.fn(), update: jest.fn() },
  user: { update: jest.fn() },
  $transaction: jest.fn(async (cb: any) => cb(mockPrisma)),
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: jest.fn(async (_req, _action, _res, handler: any) => {
    return handler(mockActorContext);
  }),
}));

describe('PATCH /api/users/profile', () => {
  let PATCH: any;

  beforeEach(async () => {
    mockPrisma.player.findUnique = jest.fn();
    mockPrisma.player.update = jest.fn();
    mockPrisma.user.update = jest.fn();
    mockPrisma.$transaction = jest.fn(async (cb: any) => cb(mockPrisma));

    mockActorContext = {
      user: { id: 'user-1' },
      actor: { userId: 'user-1', athletePlayerId: null },
    };
    const mod = await import('../route');
    PATCH = mod.PATCH;
  });

  it('retorna 403 se o usuário for um atleta menor de 18 anos', async () => {
    const minorBirthDate = new Date();
    minorBirthDate.setFullYear(minorBirthDate.getFullYear() - 15);

    mockActorContext = {
      user: { id: 'user-minor' },
      actor: { userId: 'user-minor', athletePlayerId: 'p-minor' },
    };
    mockPrisma.player.findUnique.mockResolvedValue({ birthDate: minorBirthDate });

    const req = new NextRequest('http://localhost/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Nome Novo' }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.message).toContain('menores de 18 anos');
  });

  it('permite atualização de nome para usuário adulto', async () => {
    const adultBirthDate = new Date(1995, 5, 10);
    mockActorContext = {
      user: { id: 'user-adult' },
      actor: { userId: 'user-adult', athletePlayerId: 'p-adult' },
    };
    mockPrisma.player.findUnique.mockResolvedValue({ birthDate: adultBirthDate });
    mockPrisma.user.update.mockResolvedValue({ id: 'user-adult', name: 'Nome Atualizado' });
    mockPrisma.player.update.mockResolvedValue({ id: 'p-adult', name: 'Nome Atualizado' });

    const req = new NextRequest('http://localhost/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Nome Atualizado' }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.name).toBe('Nome Atualizado');
  });

  it('valida tamanho mínimo do nome', async () => {
    const req = new NextRequest('http://localhost/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'A' }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });
});
