import { NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import {
  getAccessUserFromRequest,
  getUserFromRequestScoped,
} from '@/lib/auth-credentials.logic';
import { invalidateSessionCache } from '@/lib/session-version.logic';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: jest.fn() } },
}));

const findUnique = prisma.user.findUnique as unknown as jest.Mock;
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'test-secret');

async function token(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret);
}

function withHeaders(headers: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost/api/x', { headers });
}

describe('guarda legado + versão de sessão (sv)', () => {
  beforeEach(() => {
    invalidateSessionCache();
    findUnique.mockReset();
    findUnique.mockResolvedValue({ sessionVersion: 1, isActive: true });
  });

  it('headers sem sv: comportamento legado, sem consultar o banco', async () => {
    const req = withHeaders({ 'x-user-id': 'u1', 'x-user-role': 'ANNOTATOR' });
    await expect(getUserFromRequestScoped(req)).resolves.toEqual({ id: 'u1', role: 'ANNOTATOR' });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('headers com sv atual passam; sv revogado → null', async () => {
    const ok = withHeaders({ 'x-user-id': 'u1', 'x-user-role': 'ANNOTATOR', 'x-user-sv': '1' });
    await expect(getUserFromRequestScoped(ok)).resolves.toEqual({ id: 'u1', role: 'ANNOTATOR' });
    invalidateSessionCache();
    const old = withHeaders({ 'x-user-id': 'u1', 'x-user-role': 'ANNOTATOR', 'x-user-sv': '0' });
    await expect(getUserFromRequestScoped(old)).resolves.toBeNull();
  });

  it('x-user-sv inválido é ignorado (tratado como legado)', async () => {
    const req = withHeaders({ 'x-user-id': 'u1', 'x-user-role': 'ADMIN', 'x-user-sv': 'abc' });
    await expect(getUserFromRequestScoped(req)).resolves.toEqual({ id: 'u1', role: 'ADMIN' });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('JWT com sv atual passa; revogado → null', async () => {
    const good = await token({ sub: 'u1', role: 'ANNOTATOR', sv: 1 });
    const goodReq = withHeaders({ authorization: `Bearer ${good}` });
    await expect(getUserFromRequestScoped(goodReq)).resolves.toEqual({ id: 'u1', role: 'ANNOTATOR' });
    invalidateSessionCache();
    const stale = await token({ sub: 'u1', role: 'ANNOTATOR', sv: 0 });
    const staleReq = withHeaders({ authorization: `Bearer ${stale}` });
    await expect(getUserFromRequestScoped(staleReq)).resolves.toBeNull();
  });

  it('JWT legado (sem sv) continua valendo', async () => {
    const legacy = await token({ sub: 'u1', role: 'ANNOTATOR' });
    const req = withHeaders({ authorization: `Bearer ${legacy}` });
    await expect(getUserFromRequestScoped(req)).resolves.toEqual({ id: 'u1', role: 'ANNOTATOR' });
  });

  it('role NONE: guarda legado rejeita, extrator novo aceita', async () => {
    const req = withHeaders({ 'x-user-id': 'u2', 'x-user-role': 'NONE' });
    await expect(getUserFromRequestScoped(req)).resolves.toBeNull();
    await expect(getAccessUserFromRequest(req)).resolves.toEqual({ id: 'u2', role: 'NONE' });
  });
});
