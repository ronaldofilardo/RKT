import { NextRequest } from 'next/server';
import { POST } from '../route';
import * as authCredentials from '@/lib/auth-credentials.logic';
import * as contextLogic from '../context.logic';

jest.mock('@/lib/auth-credentials.logic');
jest.mock('../context.logic');

describe('POST /api/auth/context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 401 se a requisição não tiver usuário autenticado', async () => {
    (authCredentials.getAccessUserFromRequest as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/auth/context', {
      method: 'POST',
      body: JSON.stringify({ contextId: 'ct-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('retorna 400 se contextId não for fornecido', async () => {
    (authCredentials.getAccessUserFromRequest as jest.Mock).mockResolvedValue({ id: 'u1', role: 'TREINADOR' });

    const req = new NextRequest('http://localhost:3000/api/auth/context', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('retorna 403 se o contexto não for autorizado para o usuário', async () => {
    (authCredentials.getAccessUserFromRequest as jest.Mock).mockResolvedValue({ id: 'u1', role: 'TREINADOR' });
    (contextLogic.switchUserContext as jest.Mock).mockResolvedValue({ success: false, error: 'CONTEXT_NOT_ALLOWED' });

    const req = new NextRequest('http://localhost:3000/api/auth/context', {
      method: 'POST',
      body: JSON.stringify({ contextId: 'ct-forged' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('retorna 200, novo accessToken e seta cookie quando autorizado', async () => {
    (authCredentials.getAccessUserFromRequest as jest.Mock).mockResolvedValue({ id: 'u1', role: 'TREINADOR' });
    (contextLogic.switchUserContext as jest.Mock).mockResolvedValue({
      success: true,
      accessToken: 'jwt-new-token',
      context: { id: 'ct-1', label: 'CT Pinheiros', role: 'TREINADOR', type: 'CT' },
      targetUrl: '/clube/treinador',
    });

    const req = new NextRequest('http://localhost:3000/api/auth/context', {
      method: 'POST',
      body: JSON.stringify({ contextId: 'ct-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.accessToken).toBe('jwt-new-token');
    expect(json.targetUrl).toBe('/clube/treinador');
    expect(res.cookies.get('rkt_access_token')?.value).toBe('jwt-new-token');
    expect(res.cookies.get('access_token')?.value).toBe('jwt-new-token');
  });
});

