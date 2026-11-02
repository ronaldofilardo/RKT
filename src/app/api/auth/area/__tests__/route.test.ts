import { NextRequest } from 'next/server';
import { POST } from '../route';
import * as authCredentials from '@/lib/auth-credentials.logic';
import * as areaSwitchLogic from '../area-switch.logic';

jest.mock('@/lib/auth-credentials.logic');
jest.mock('../area-switch.logic');

describe('POST /api/auth/area', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 401 se a requisição não tiver usuário autenticado', async () => {
    (authCredentials.getAccessUserFromRequest as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/auth/area', {
      method: 'POST',
      body: JSON.stringify({ area: 'TREINADOR_AVULSO' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('retorna 400 se a área for inválida', async () => {
    (authCredentials.getAccessUserFromRequest as jest.Mock).mockResolvedValue({ id: 'u1', role: 'TREINADOR' });

    const req = new NextRequest('http://localhost:3000/api/auth/area', {
      method: 'POST',
      body: JSON.stringify({ area: 'AREA_INEXISTENTE' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('retorna 403 se a área não for autorizada para o usuário', async () => {
    (authCredentials.getAccessUserFromRequest as jest.Mock).mockResolvedValue({ id: 'u1', role: 'TREINADOR' });
    (areaSwitchLogic.switchUserArea as jest.Mock).mockResolvedValue({ success: false, error: 'AREA_NOT_ALLOWED' });

    const req = new NextRequest('http://localhost:3000/api/auth/area', {
      method: 'POST',
      body: JSON.stringify({ area: 'ADMIN' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('retorna 200, novo accessToken e seta cookie quando autorizado', async () => {
    (authCredentials.getAccessUserFromRequest as jest.Mock).mockResolvedValue({ id: 'u1', role: 'TREINADOR' });
    (areaSwitchLogic.switchUserArea as jest.Mock).mockResolvedValue({
      success: true,
      accessToken: 'jwt-area-token',
      area: 'TREINADOR_AVULSO',
      prefix: '/treinador',
      home: '/treinador',
    });

    const req = new NextRequest('http://localhost:3000/api/auth/area', {
      method: 'POST',
      body: JSON.stringify({ area: 'TREINADOR_AVULSO' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.accessToken).toBe('jwt-area-token');
    expect(json.prefix).toBe('/treinador');
    expect(res.cookies.get('rkt_access_token')?.value).toBe('jwt-area-token');
  });
});

