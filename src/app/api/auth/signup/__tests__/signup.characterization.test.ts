import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { POST } from '../route';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findFirst: jest.fn(), create: jest.fn() },
    membership: { create: jest.fn() },
    player: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn() },
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-pass'),
}));

describe('Characterization & Security: POST /api/auth/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.player.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'al-1' });
  });

  it('permite signup com email e grava email se cpf nao fornecido', async () => {
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'u-1',
      name: 'Atleta Email',
      email: 'atleta@example.com',
      cpf: 'atleta@example.com',
    });
    (prisma.player.create as jest.Mock).mockResolvedValue({ id: 'p-1' });

    const req = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Atleta Email',
        identifier: 'atleta@example.com',
        password: 'password123',
        role: 'ATLETA',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('rejeita CPF com digitos invalidos mod 11', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Atleta Invalido',
        identifier: '11111111111',
        password: 'password123',
        role: 'ATLETA',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toContain('CPF inválido');
  });

  it('aceita CPF valido (52998224725) e cria player para role ATLETA', async () => {
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: 'u-2', name: 'Atleta Novo' });
    (prisma.player.create as jest.Mock).mockResolvedValue({ id: 'p-2' });

    const req = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Atleta Novo',
        identifier: '52998224725',
        password: 'password123',
        role: 'ATLETA',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(prisma.player.create).toHaveBeenCalledTimes(1);
  });

  describe('Fase 5: Claim automático', () => {
    const cpfValido = '529.982.247-25';
    const birthDateAdulto = '1990-01-01';
    const birthDateMenor = '2015-01-01';

    it('faz claim automático quando CPF+birthDate batem Player PROVISIONAL e maior de idade', async () => {
      (prisma.user.create as jest.Mock).mockResolvedValue({ id: 'u-3', name: 'Atleta Claim' });
      (prisma.player.findFirst as jest.Mock).mockResolvedValue({
        id: 'p-prov',
        cpfHash: 'hash-qualquer',
        cpfLast2: '25',
        userId: null,
        identityStatus: 'PROVISIONAL',
      });

      const req = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Atleta Claim',
          identifier: cpfValido,
          password: 'password123',
          role: 'ATLETA',
          cpf: cpfValido,
          birthDate: birthDateAdulto,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      expect(prisma.player.update).toHaveBeenCalledWith({
        where: { id: 'p-prov' },
        data: { userId: 'u-3', identityStatus: 'CONFIRMED' },
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorUserId: 'u-3',
          action: 'PLAYER_CLAIM_AUTO',
          resourceType: 'Player',
          resourceId: 'p-prov',
        }),
      });
    });

    it('bloqueia claim automático para menor e cria Player vinculado CONFIRMED', async () => {
      (prisma.user.create as jest.Mock).mockResolvedValue({ id: 'u-4', name: 'Atleta Menor' });
      (prisma.player.findFirst as jest.Mock).mockResolvedValue({
        id: 'p-prov-menor',
        cpfHash: 'hash-qualquer',
        cpfLast2: '25',
        userId: null,
        identityStatus: 'PROVISIONAL',
      });
      (prisma.player.create as jest.Mock).mockResolvedValue({ id: 'p-novo' });

      const req = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Atleta Menor',
          identifier: cpfValido,
          password: 'password123',
          role: 'ATLETA',
          cpf: cpfValido,
          birthDate: birthDateMenor,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      expect(prisma.player.update).not.toHaveBeenCalled();
      expect(prisma.player.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'u-4', identityStatus: 'CONFIRMED' }),
        }),
      );
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('nao faz claim quando CPF+birthDate nao batem Player PROVISIONAL', async () => {
      (prisma.user.create as jest.Mock).mockResolvedValue({ id: 'u-5', name: 'Atleta Sem Match' });
      (prisma.player.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.player.create as jest.Mock).mockResolvedValue({ id: 'p-5' });

      const req = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Atleta Sem Match',
          identifier: cpfValido,
          password: 'password123',
          role: 'ATLETA',
          cpf: cpfValido,
          birthDate: birthDateAdulto,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      expect(prisma.player.create).toHaveBeenCalledTimes(1);
      expect(prisma.player.update).not.toHaveBeenCalled();
    });
  });
});


