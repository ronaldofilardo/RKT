import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockPrisma = {
  playerCT: { findFirst: jest.fn() },
  user: { update: jest.fn() },
  player: { update: jest.fn() },
  auditLog: { create: jest.fn() },
};

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: (_req: any, _act: any, _res: any, handler: any) =>
    handler({ user: { id: 'u-gestor-1' } }),
}));
jest.mock('../../../_logic', () => ({
  getGestorCtId: jest.fn().mockResolvedValue('ct-1'),
  denyGestor: jest.fn(),
}));

describe('PATCH /api/gestor/athletes/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 400 sem lançar SyntaxError quando o corpo da requisição for vazio', async () => {
    const { PATCH } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/gestor/athletes/p-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'p-1' }) });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('VALIDATION_ERROR');
  });

  it('atualiza atleta com sucesso quando dados válidos são enviados', async () => {
    (mockPrisma.playerCT.findFirst as any).mockResolvedValue({
      id: 'pct-1',
      playerId: 'p-1',
      player: { id: 'p-1', userId: 'u-1', user: { id: 'u-1' } },
    });
    (mockPrisma.user.update as any).mockResolvedValue({});
    (mockPrisma.player.update as any).mockResolvedValue({});
    (mockPrisma.auditLog.create as any).mockResolvedValue({});

    const { PATCH } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/gestor/athletes/p-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Atleta Editado',
        cpf: '12345678901',
        birthDate: '2005-01-01',
        gender: 'MASCULINO',
        dominance: 'DESTRO',
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'p-1' }) });
    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u-1' },
      data: { name: 'Atleta Editado', cpf: '12345678901' },
    });
  });

  it('aceita gender MALE e dominance LEFT (vocabulário canônico) e grava idade pelo ano', async () => {
    (mockPrisma.playerCT.findFirst as any).mockResolvedValue({
      id: 'pct-1',
      playerId: 'p-1',
      player: { id: 'p-1', userId: 'u-1', user: { id: 'u-1' } },
    });
    (mockPrisma.user.update as any).mockResolvedValue({});
    (mockPrisma.player.update as any).mockResolvedValue({});
    (mockPrisma.auditLog.create as any).mockResolvedValue({});

    const { PATCH } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/gestor/athletes/p-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'yoanis',
        cpf: '12345678996',
        birthDate: '2001-01-01',
        gender: 'MALE',
        dominance: 'LEFT',
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'p-1' }) });
    expect(res.status).toBe(200);
    expect(mockPrisma.player.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          gender: 'MALE',
          dominance: 'LEFT',
          age: new Date().getFullYear() - 2001,
        }),
      }),
    );
  });

  it('normaliza legado MASCULINO/DESTRO para MALE/RIGHT', async () => {
    (mockPrisma.playerCT.findFirst as any).mockResolvedValue({
      id: 'pct-1',
      playerId: 'p-1',
      player: { id: 'p-1', userId: 'u-1', user: { id: 'u-1' } },
    });
    (mockPrisma.user.update as any).mockResolvedValue({});
    (mockPrisma.player.update as any).mockResolvedValue({});
    (mockPrisma.auditLog.create as any).mockResolvedValue({});

    const { PATCH } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/gestor/athletes/p-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Atleta', cpf: '12345678901', birthDate: '2005-01-01', gender: 'FEMININO', dominance: 'CANHOTO' }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'p-1' }) });
    expect(res.status).toBe(200);
    expect(mockPrisma.player.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ gender: 'FEMALE', dominance: 'LEFT' }) }),
    );
  });

  it('rejeita gênero fora de Masculino/Feminino', async () => {
    const { PATCH } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/gestor/athletes/p-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Atleta', cpf: '12345678901', birthDate: '2005-01-01', gender: 'OUTRO', dominance: 'RIGHT' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'p-1' }) });
    expect(res.status).toBe(400);
  });

  it('edita atleta SEM conta de usuário (cadastrado só com ano) sem retornar 404', async () => {
    (mockPrisma.playerCT.findFirst as any).mockResolvedValue({
      id: 'pct-2',
      playerId: 'p-2',
      player: { id: 'p-2', userId: null, user: null },
    });
    (mockPrisma.player.update as any).mockResolvedValue({});
    (mockPrisma.auditLog.create as any).mockResolvedValue({});

    const { PATCH } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/gestor/athletes/p-2', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Atleta Sem Conta', cpf: '', birthDate: '2008-03-10', gender: 'MALE', dominance: 'RIGHT' }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'p-2' }) });
    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(mockPrisma.player.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ gender: 'MALE', age: new Date().getFullYear() - 2008 }) }),
    );
  });

  it('exige CPF válido quando o atleta tem conta de usuário', async () => {
    (mockPrisma.playerCT.findFirst as any).mockResolvedValue({
      id: 'pct-1',
      playerId: 'p-1',
      player: { id: 'p-1', userId: 'u-1', user: { id: 'u-1' } },
    });
    const { PATCH } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/gestor/athletes/p-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Atleta', cpf: '', birthDate: '2005-01-01', gender: 'MALE', dominance: 'RIGHT' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'p-1' }) });
    expect(res.status).toBe(400);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it('atleta sem conta: grava hash e 2 últimos dígitos do CPF informado', async () => {
    (mockPrisma.playerCT.findFirst as any).mockResolvedValue({
      id: 'pct-2',
      playerId: 'p-2',
      player: { id: 'p-2', userId: null, user: null },
    });
    (mockPrisma.player.update as any).mockResolvedValue({});
    (mockPrisma.auditLog.create as any).mockResolvedValue({});

    const { PATCH } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/gestor/athletes/p-2', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sem Conta', cpf: '529.982.247-25', birthDate: '2001-01-01', gender: 'MALE', dominance: 'RIGHT' }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'p-2' }) });
    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(mockPrisma.player.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ cpf: '52998224725', cpfLast2: '25', cpfHash: expect.any(String) }) }),
    );
  });

  it('atleta sem conta: CPF vazio não altera o CPF já gravado', async () => {
    (mockPrisma.playerCT.findFirst as any).mockResolvedValue({
      id: 'pct-2',
      playerId: 'p-2',
      player: { id: 'p-2', userId: null, user: null },
    });
    (mockPrisma.player.update as any).mockResolvedValue({});
    (mockPrisma.auditLog.create as any).mockResolvedValue({});

    const { PATCH } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/gestor/athletes/p-2', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sem Conta', cpf: '', birthDate: '2001-01-01', gender: 'MALE', dominance: 'RIGHT' }),
    });

    await PATCH(req, { params: Promise.resolve({ id: 'p-2' }) });
    const data = (mockPrisma.player.update as any).mock.calls[0][0].data;
    expect(data).not.toHaveProperty('cpfHash');
    expect(data).not.toHaveProperty('cpfLast2');
  });

  it('atleta sem conta: aceita CPF de 11 dígitos mesmo sem dígitos verificadores válidos (dados de teste)', async () => {
    (mockPrisma.playerCT.findFirst as any).mockResolvedValue({
      id: 'pct-2',
      playerId: 'p-2',
      player: { id: 'p-2', userId: null, user: null },
    });
    (mockPrisma.player.update as any).mockResolvedValue({});
    (mockPrisma.auditLog.create as any).mockResolvedValue({});

    const { PATCH } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/gestor/athletes/p-2', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sem Conta', cpf: '12345678997', birthDate: '2001-01-01', gender: 'MALE', dominance: 'RIGHT' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'p-2' }) });
    expect(res.status).toBe(200);
    expect(mockPrisma.player.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ cpf: '12345678997', cpfLast2: '97' }) }),
    );
  });

  it('atleta sem conta: rejeita CPF com menos de 11 dígitos', async () => {
    const { PATCH } = await import('../route');
    const req = new NextRequest('http://localhost:3000/api/gestor/athletes/p-2', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sem Conta', cpf: '1234567', birthDate: '2001-01-01', gender: 'MALE', dominance: 'RIGHT' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'p-2' }) });
    expect(res.status).toBe(400);
    expect(mockPrisma.player.update).not.toHaveBeenCalled();
  });
});
