jest.mock('@/services/adminService', () => ({
  listAllUsers: jest.fn(),
  createUser: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { listAllUsers, createUser } from '@/services/adminService';
import { makeAuthHeaders } from '@/test-helpers/auth';

const mockListAllUsers = listAllUsers as jest.MockedFunction<typeof listAllUsers>;
const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;

let ADMIN_HEADERS: Record<string, string> = {};
let ATHLETE_HEADERS: Record<string, string> = {};

beforeAll(async () => {
  ADMIN_HEADERS = await makeAuthHeaders('user-admin', 'ADMIN');
  ATHLETE_HEADERS = await makeAuthHeaders('user-ath', 'ATHLETE');
});

describe('Admin Users API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/users', () => {
    it('deve exigir role ADMIN', async () => {
      const { GET } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        headers: ATHLETE_HEADERS,
      });
      const res = await GET(req);
      expect(res.status).toBe(403);
      expect(mockListAllUsers).not.toHaveBeenCalled();
    });

    it('deve retornar lista de usuários', async () => {
      mockListAllUsers.mockResolvedValue([{ id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN', club: null, createdAt: new Date() }]);

      const { GET } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        headers: ADMIN_HEADERS,
      });
      const res = await GET(req);
      const data = await res.json();
      expect(data.data.users).toHaveLength(1);
      expect(data.data.users[0].name).toBe('Admin');
    });

    it('deve retornar 500 em caso de erro', async () => {
      mockListAllUsers.mockRejectedValue(new Error('DB Error'));

      const { GET } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        headers: ADMIN_HEADERS,
      });
      const res = await GET(req);
      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/admin/users', () => {
    const validBody = { name: 'User', email: 'user@test.com', password: '12345678', role: 'ATHLETE' };

    it('deve exigir role ADMIN', async () => {
      const { POST } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(validBody),
        headers: ATHLETE_HEADERS,
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it('deve validar campos obrigatórios', async () => {
      const { POST } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      // handleApiError wraps in { data: { error: ... } }
      expect(data.data.error).toBe('VALIDATION_ERROR');
    });

    it('deve validar role', async () => {
      const { POST } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ ...validBody, role: 'INVALID' }),
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.data.error).toBe('VALIDATION_ERROR');
    });

    it('deve retornar 409 se email já existe', async () => {
      mockCreateUser.mockResolvedValue({ error: 'EMAIL_ALREADY_EXISTS' });

      const { POST } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(validBody),
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
      });
      const res = await POST(req);
      expect(res.status).toBe(409);
    });

    it('deve criar usuário com sucesso', async () => {
      mockCreateUser.mockResolvedValue({ id: 'u1', name: 'User', email: 'user@test.com', role: 'ATHLETE', club: null, createdAt: new Date() });

      const { POST } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(validBody),
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.data.id).toBe('u1');
    });

    it('deve retornar 500 para erro desconhecido do service', async () => {
      mockCreateUser.mockResolvedValue({ error: 'UNKNOWN_ERROR' });

      const { POST } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(validBody),
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
      });
      const res = await POST(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe('UNKNOWN_ERROR');
    });

    it('deve retornar 500 em caso de erro inesperado', async () => {
      mockCreateUser.mockRejectedValue(new Error('DB Error'));

      const { POST } = await import('../route');
      const req = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(validBody),
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
      });
      const res = await POST(req);
      expect(res.status).toBe(500);
    });
  });
});
