jest.mock('@/services/adminService', () => ({
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { updateUser, deleteUser } from '@/services/adminService';
import { makeAuthHeaders } from '@/test-helpers/auth';

const mockUpdateUser = updateUser as jest.MockedFunction<typeof updateUser>;
const mockDeleteUser = deleteUser as jest.MockedFunction<typeof deleteUser>;

let ADMIN_HEADERS: Record<string, string> = {};
let ATHLETE_HEADERS: Record<string, string> = {};

beforeAll(async () => {
  ADMIN_HEADERS = await makeAuthHeaders('user-admin', 'ADMIN');
  ATHLETE_HEADERS = await makeAuthHeaders('user-ath', 'ATHLETE');
});

describe('Admin User [id] API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH /api/admin/users/[id]', () => {
    it('deve exigir role ADMIN', async () => {
      const { PATCH } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users/u1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Edit' }),
        headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: 'u1' }) });
      expect(res.status).toBe(403);
    });

    it('deve validar role se enviada', async () => {
      const { PATCH } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users/u1', {
        method: 'PATCH',
        body: JSON.stringify({ role: 'INVALID' }),
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
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
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
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
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
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
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
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
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: 'u1' }) });
      expect(res.status).toBe(500);
    });
  });

  describe('DELETE /api/admin/users/[id]', () => {
    it('deve exigir role ADMIN', async () => {
      const { DELETE } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users/u1', {
        method: 'DELETE',
        headers: ATHLETE_HEADERS,
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: 'u1' }) });
      expect(res.status).toBe(403);
    });

    it('deve retornar 404 se usuário não encontrado', async () => {
      mockDeleteUser.mockResolvedValue({ error: 'USER_NOT_FOUND' });

      const { DELETE } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users/not-found', {
        method: 'DELETE',
        headers: ADMIN_HEADERS,
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: 'not-found' }) });
      expect(res.status).toBe(404);
    });

    it('deve retornar 500 para erro desconhecido', async () => {
      mockDeleteUser.mockResolvedValue({ error: 'SOME_UNKNOWN_ERROR' });

      const { DELETE } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users/u1', {
        method: 'DELETE',
        headers: ADMIN_HEADERS,
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: 'u1' }) });
      expect(res.status).toBe(500);
    });

    it('deve deletar usuário com sucesso', async () => {
      mockDeleteUser.mockResolvedValue({ success: true });

      const { DELETE } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users/u1', {
        method: 'DELETE',
        headers: ADMIN_HEADERS,
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
        headers: ADMIN_HEADERS,
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: 'u1' }) });
      expect(res.status).toBe(500);
    });
  });
});
