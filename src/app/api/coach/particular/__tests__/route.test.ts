import { NextRequest } from 'next/server';
import { POST } from '../route';
import * as authCredentials from '@/lib/auth-credentials.logic';
import * as particularLogic from '../particular.logic';

jest.mock('@/lib/auth-credentials.logic');
jest.mock('../particular.logic');

describe('POST /api/coach/particular', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 401 se não houver usuário autenticado', async () => {
    (authCredentials.getAccessUserFromRequest as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/coach/particular', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('retorna 403 se o usuário não for treinador', async () => {
    (authCredentials.getAccessUserFromRequest as jest.Mock).mockResolvedValue({ id: 'u1', role: 'ATLETA' });
    (particularLogic.activateParticularCoach as jest.Mock).mockResolvedValue({
      success: false,
      error: 'ONLY_COACHES_ALLOWED',
      status: 403,
    });

    const req = new NextRequest('http://localhost:3000/api/coach/particular', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('retorna 201 e ativa o perfil avulso com sucesso', async () => {
    (authCredentials.getAccessUserFromRequest as jest.Mock).mockResolvedValue({ id: 'coach-1', role: 'TREINADOR' });
    (particularLogic.activateParticularCoach as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Perfil particular ativado com sucesso',
    });

    const req = new NextRequest('http://localhost:3000/api/coach/particular', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});

