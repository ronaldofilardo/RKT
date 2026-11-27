import { NextRequest } from 'next/server';
import { enforceOriginCheck } from '@/middleware-csrf.logic';
import { middleware } from '@/middleware';

describe('Middleware Webhook CSRF & Public Route Exemption', () => {
  it('enforceOriginCheck ignora rotas /api/webhooks/ mesmo sem origin/referer', () => {
    const req = new NextRequest('http://localhost:3000/api/webhooks/asaas', {
      method: 'POST',
      headers: { 'asaas-access-token': 'token123' },
    });
    const violation = enforceOriginCheck(req);
    expect(violation).toBeNull();
  });

  it('enforceOriginCheck ignora rotas /api/webhooks/ mesmo com origin externo', () => {
    const req = new NextRequest('http://localhost:3000/api/webhooks/asaas', {
      method: 'POST',
      headers: {
        origin: 'https://api.asaas.com',
        'asaas-access-token': 'token123',
      },
    });
    const violation = enforceOriginCheck(req);
    expect(violation).toBeNull();
  });

  it('middleware permite acesso público a /api/webhooks/asaas sem exigir JWT de usuário', async () => {
    const req = new NextRequest('http://localhost:3000/api/webhooks/asaas', {
      method: 'POST',
      headers: { 'asaas-access-token': 'token123' },
    });
    const res = await middleware(req);
    // Não deve redirecionar para /login (307) nem bloquear com 401/403
    expect(res.status).toBe(200);
  });
});
