import { NextRequest } from 'next/server';
import { POST } from '../route';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const secretKey = new TextEncoder().encode(JWT_SECRET);

describe('/api/auth/refresh - Preservação de Claims', () => {
  it('preserva integralmente pp, mk, mcp, cx, ax, ct e ars no refresh', async () => {
    const originalToken = await new SignJWT({
      sub: 'usr-123',
      role: 'TREINADOR',
      mcp: true,
      pp: 'GESTOR',
      mk: 'TREINADOR',
      cx: 'ct-abc',
      ax: 'TREINADOR_CLUBE',
      ct: 'ct-abc',
      ars: ['TREINADOR_CLUBE', 'TREINADOR_AVULSO'],
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(secretKey);

    const headers = new Headers();
    headers.set('authorization', `Bearer ${originalToken}`);
    const req = new NextRequest(new URL('http://localhost/api/auth/refresh'), { method: 'POST', headers });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    const { payload } = await jwtVerify(data.accessToken, secretKey);

    expect(payload.sub).toBe('usr-123');
    expect(payload.role).toBe('TREINADOR');
    // O `sv` é um claim de controlo de sessão que só vem do banco (incrementado em
    // login/reset-password), não é preservado em refresh. Tokens legados sem sv são
    // aceites (isSessionCurrent retorna true quando sv === undefined).
    expect(payload.mcp).toBe(true);
    expect(payload.pp).toBe('GESTOR');
    expect(payload.mk).toBe('TREINADOR');
    expect(payload.cx).toBe('ct-abc');
    expect(payload.ax).toBe('TREINADOR_CLUBE');
    expect(payload.ct).toBe('ct-abc');
    expect(payload.ars).toEqual(['TREINADOR_CLUBE', 'TREINADOR_AVULSO']);
  });
});

