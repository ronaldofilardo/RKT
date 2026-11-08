import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockPrisma = {
  membership: { findFirst: jest.fn() },
  user: { findFirst: jest.fn(), update: jest.fn() },
  auditLog: { create: jest.fn() },
};

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('@/lib/access-handler', () => ({
  withAccessHandler: (_req: any, _act: any, _res: any, handler: any) =>
    handler({ user: { id: 'u-gestor-1' } }),
}));
jest.mock('../_logic', () => ({
  getGestorCtId: jest.fn().mockResolvedValue('ct-1'),
  denyGestor: jest.fn(),
}));
jest.mock('../coaches-logic', () => ({
  updateCoachPermissions: jest.fn().mockResolvedValue({ id: 'mem-1' }),
}));

describe('PATCH /api/gestor/coaches/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 400 quando o body for vazio ou inválido', async () => {
    const { PATCH } = await import('../coaches/[id]/route');
    const req = new NextRequest('http://localhost:3000/api/gestor/coaches/u-coach-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'u-coach-1' }) });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('VALIDATION_ERROR');
  });

  it('atualiza permissões quando enviado canInsertAthletes', async () => {
    const { PATCH } = await import('../coaches/[id]/route');
    const { updateCoachPermissions } = await import('../coaches-logic');
    const req = new NextRequest('http://localhost:3000/api/gestor/coaches/mem-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canInsertAthletes: false }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'mem-1' }) });
    expect(res.status).toBe(200);
    expect(updateCoachPermissions).toHaveBeenCalledWith('mem-1', { canInsertAthletes: false });
  });

  it('atualiza dados do treinador (nome, CPF, email) com sucesso', async () => {
    (mockPrisma.membership.findFirst as any).mockResolvedValue({
      id: 'mem-1',
      userId: 'u-coach-1',
      ctId: 'ct-1',
      user: { id: 'u-coach-1', name: 'Treinador Antigo', email: 'antigo@rkt.com', cpf: '11144477735' },
    });
    (mockPrisma.user.findFirst as any).mockResolvedValue(null);
    (mockPrisma.user.update as any).mockResolvedValue({});
    (mockPrisma.auditLog.create as any).mockResolvedValue({});

    const { PATCH } = await import('../coaches/[id]/route');
    const req = new NextRequest('http://localhost:3000/api/gestor/coaches/u-coach-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Treinador Atualizado',
        cpf: '111.444.777-35',
        birthDate: '',
        email: 'novo@rkt.com',
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'u-coach-1' }) });
    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u-coach-1' },
      data: {
        name: 'Treinador Atualizado',
        cpf: '11144477735',
        email: 'novo@rkt.com',
      },
    });
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorUserId: 'u-gestor-1',
          action: 'TREINADOR_DADOS_ATUALIZADOS',
          resourceType: 'User',
          resourceId: 'u-coach-1',
          ctId: 'ct-1',
        }),
      }),
    );
  });

  it('retorna 404 se o vínculo do treinador não for encontrado no clube', async () => {
    (mockPrisma.membership.findFirst as any).mockResolvedValue(null);

    const { PATCH } = await import('../coaches/[id]/route');
    const req = new NextRequest('http://localhost:3000/api/gestor/coaches/u-coach-unknown', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Treinador Inexistente',
        cpf: '111.444.777-35',
        email: 'coach@teste.com',
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'u-coach-unknown' }) });
    expect(res.status).toBe(404);
  });

  it('retorna 409 quando houver conflito de CPF com outro usuário', async () => {
    (mockPrisma.membership.findFirst as any).mockResolvedValue({
      id: 'mem-1',
      userId: 'u-coach-1',
      ctId: 'ct-1',
      user: { id: 'u-coach-1' },
    });
    (mockPrisma.user.findFirst as any).mockResolvedValue({
      id: 'u-other',
      cpf: '11144477735',
      email: 'outro@rkt.com',
    });

    const { PATCH } = await import('../coaches/[id]/route');
    const req = new NextRequest('http://localhost:3000/api/gestor/coaches/u-coach-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Treinador Conflito',
        cpf: '111.444.777-35',
        email: 'novo@rkt.com',
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'u-coach-1' }) });
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe('CONFLICT');
  });
});

