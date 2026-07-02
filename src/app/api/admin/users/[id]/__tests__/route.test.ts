jest.mock('@/lib/auth', () => ({
  requireRole: jest.fn(),
}));

jest.mock('@/services/adminService', () => ({
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth';
import { updateUser, deleteUser } from '@/services/adminService';

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockUpdateUser = updateUser as jest.MockedFunction<typeof updateUser>;
const mockDeleteUser = deleteUser as jest.MockedFunction<typeof deleteUser>;

describe('Admin User [id] API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(null);
  });

  describe('PATCH /api/admin/users/[id]', () => {
    it('deve exigir role ADMIN', async () => {
      mockRequireRole.mockResolvedValue(new Response('Forbidden', { status: 403 }) as any);

      const { PATCH } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users/u1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Edit' }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: 'u1' }) });
      expect(res.status).toBe(403);
    });

    it('deve validar role se enviada', async () => {
      const { PATCH } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users/u1', {
        method: 'PATCH',
        body: JSON.stringify({ role: 'INVALID' }),
        headers: { authorization: 'Bearer token' },
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: 'u1' }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('VALIDATION_ERROR');
    });

    it('deve retornar 404 se usuário não encontrado', async () => {
      mockUpdateUser.mockResolvedValue({ error: 'USER_NOT_FOUND' });

      const { PATCH } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users/not-found', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Edit' }),
        headers: { authorization: 'Bearer token' },
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: 'not-found' }) });
      expect(res.status).toBe(404);
    });

    it('deve retornar 500 para erro desconhecido', async () => {
      mockUpdateUser.mockResolvedValue({ error: 'SOME_UNKNOWN_ERROR' });

      const { PATCH } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users/u1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Edit' }),
        headers: { authorization: 'Bearer token' },
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: 'u1' }) });
      expect(res.status).toBe(500);
    });

    it('deve atualizar usuário com sucesso', async () => {
      mockUpdateUser.mockResolvedValue({ id: 'u1', name: 'Editado', email: 'a@b.com', role: 'COACH', club: null });

      const { PATCH } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users/u1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Editado', role: 'COACH' }),
        headers: { authorization: 'Bearer token' },
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: 'u1' }) });
      const data = await res.json();
      expect(data.name).toBe('Editado');
      expect(mockUpdateUser).toHaveBeenCalledWith('u1', { name: 'Editado', role: 'COACH' });
    });

    it('deve retornar 500 em caso de erro inesperado', async () => {
      mockUpdateUser.mockRejectedValue(new Error('DB Error'));

      const { PATCH } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users/u1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Edit' }),
        headers: { authorization: 'Bearer token' },
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: 'u1' }) });
      expect(res.status).toBe(500);
    });
  });

  describe('DELETE /api/admin/users/[id]', () => {
    it('deve exigir role ADMIN', async () => {
      mockRequireRole.mockResolvedValue(new Response('Forbidden', { status: 403 }) as any);

      const { DELETE } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users/u1', { method: 'DELETE' });
      const res = await DELETE(req, { params: Promise.resolve({ id: 'u1' }) });
      expect(res.status).toBe(403);
    });

    it('deve retornar 404 se usuário não encontrado', async () => {
      mockDeleteUser.mockResolvedValue({ error: 'USER_NOT_FOUND' });

      const { DELETE } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users/not-found', {
        method: 'DELETE',
        headers: { authorization: 'Bearer token' },
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: 'not-found' }) });
      expect(res.status).toBe(404);
    });

    it('deve retornar 500 para erro desconhecido', async () => {
      mockDeleteUser.mockResolvedValue({ error: 'SOME_UNKNOWN_ERROR' });

      const { DELETE } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users/u1', {
        method: 'DELETE',
        headers: { authorization: 'Bearer token' },
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: 'u1' }) });
      expect(res.status).toBe(500);
    });

    it('deve deletar usuário com sucesso', async () => {
      mockDeleteUser.mockResolvedValue({ success: true });

      const { DELETE } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users/u1', {
        method: 'DELETE',
        headers: { authorization: 'Bearer token' },
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: 'u1' }) });
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(mockDeleteUser).toHaveBeenCalledWith('u1');
    });

    it('deve retornar 500 em caso de erro inesperado', async () => {
      mockDeleteUser.mockRejectedValue(new Error('DB Error'));

      const { DELETE } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users/u1', {
        method: 'DELETE',
        headers: { authorization: 'Bearer token' },
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: 'u1' }) });
      expect(res.status).toBe(500);
    });
  });
});
