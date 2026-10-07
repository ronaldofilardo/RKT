import { NextRequest } from 'next/server';
import { POST } from '../route';
import { SignJWT } from 'jose';
import { TextEncoder } from 'util';

const JWT_SECRET = process.env.JWT_SECRET;

const secretKey = JWT_SECRET ? new TextEncoder().encode(JWT_SECRET) : null;

async function generateToken(
  userId: string,
  role: string,
): Promise<string> {
  if (!secretKey) {
    throw new Error('JWT_SECRET is not defined in environment');
  }
  return new SignJWT({ sub: userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secretKey);
}

async function makeRequest(
  cookieValue?: string,
  authHeader?: string,
) {
  const headers = new Headers();
  if (authHeader) headers.set('authorization', authHeader);
  if (cookieValue) headers.set('cookie', `rkt_access_token=${cookieValue}`);

  return new NextRequest(new URL('http://localhost/api/auth/refresh'), {
    method: 'POST',
    headers,
  });
}

describe('/api/auth/refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 401 se nenhum token for fornecido', async () => {
    const req = await makeRequest();
    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('UNAUTHORIZED');
  });

  it('retorna 401 se token for inválido', async () => {
    const req = await makeRequest('invalid-token');
    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('UNAUTHORIZED');
  });

  it('retorna 401 se token estiver expirado', async () => {
    if (!secretKey) throw new Error('JWT_SECRET not set');
    // Generate a token that's already expired (exp in the past)
    const expiredToken = await new SignJWT({ sub: 'user-1', role: 'ANNOTATOR' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1s') // Expires in 1 second, will be expired by test time
      .sign(secretKey);

    // Wait for token to expire
    await new Promise((r) => setTimeout(r, 1100));

    const req = await makeRequest(expiredToken);
    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('UNAUTHORIZED');
  });

  it('retorna 200 com novo accessToken e define cookie se token for válido', async () => {
    if (!secretKey) throw new Error('JWT_SECRET not set');
    const originalToken = await generateToken('user-1', 'ANNOTATOR');

    const req = await makeRequest(originalToken);
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('accessToken');
    expect(typeof data.accessToken).toBe('string');

    // Verify cookie is set
    const cookies = res.headers.get('set-cookie');
    expect(cookies).toContain('rkt_access_token=');
    expect(cookies).toContain('HttpOnly');
  });

  it('retorna 200 com novo accessToken e define cookie via Authorization header', async () => {
    if (!secretKey) throw new Error('JWT_SECRET not set');
    const originalToken = await generateToken('user-2', 'ADMIN');

    const req = await makeRequest(undefined, `Bearer ${originalToken}`);
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('accessToken');
    expect(typeof data.accessToken).toBe('string');

    // Verify cookie is set
    const cookies = res.headers.get('set-cookie');
    expect(cookies).toContain('rkt_access_token=');
    expect(cookies).toContain('HttpOnly');
  });

  it('novo token tem payload correto (sub e role preservados)', async () => {
    if (!secretKey) throw new Error('JWT_SECRET not set');
    const originalToken = await generateToken('user-3', 'ANNOTATOR');

    const req = await makeRequest(originalToken);
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    const newToken = data.accessToken;

    // Decode and verify new token payload
    const { payload } = await require('jose').jwtVerify(
      newToken,
      secretKey,
    );
    expect(payload.sub).toBe('user-3');
    expect(payload.role).toBe('ANNOTATOR');
  });
});