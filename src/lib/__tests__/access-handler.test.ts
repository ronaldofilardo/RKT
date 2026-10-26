import { NextRequest, NextResponse } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';
import { getRLSUser } from '@/lib/rls-context';
import { getActor } from '@/services/accessService';
import type { Actor } from '@/core/access';

jest.mock('@/lib/auth-credentials.logic', () => ({ getAccessUserFromRequest: jest.fn() }));
jest.mock('@/services/accessService', () => ({ getActor: jest.fn() }));

const userMock = getAccessUserFromRequest as unknown as jest.Mock;
const actorMock = getActor as unknown as jest.Mock;
const req = () => new NextRequest('http://localhost/api/x');

const gestor: Actor = {
  userId: 'u1',
  isActive: true,
  canOperate: false,
  memberships: [{ kind: 'GESTOR', ctId: 'ct-1', status: 'ACTIVE' }],
  athletePlayerId: null,
  guardianOfPlayerIds: [],
};

describe('withAccessHandler', () => {
  beforeEach(() => {
    userMock.mockReset();
    actorMock.mockReset();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('401 sem usuário autenticado', async () => {
    userMock.mockResolvedValue(null);
    const res = await withAccessHandler(req(), 'athlete:create', null, async () => NextResponse.json({}));
    expect(res.status).toBe(401);
  });

  it('401 quando a conta não existe mais', async () => {
    userMock.mockResolvedValue({ id: 'u1', role: 'ANNOTATOR' });
    actorMock.mockResolvedValue(null);
    const res = await withAccessHandler(req(), 'athlete:create', null, async () => NextResponse.json({}));
    expect(res.status).toBe(401);
  });

  it('403 sem permissão, sem vazar o motivo', async () => {
    userMock.mockResolvedValue({ id: 'u1', role: 'ANNOTATOR' });
    actorMock.mockResolvedValue(gestor);
    const res = await withAccessHandler(req(), 'support:account:assist', null, async () => NextResponse.json({}));
    expect(res.status).toBe(403);
    const body = JSON.stringify(await res.json());
    expect(body).not.toMatch(/no-permission|out-of-scope|inactive/);
  });

  it('respeita o escopo informado por resolveResource', async () => {
    userMock.mockResolvedValue({ id: 'u1', role: 'ANNOTATOR' });
    actorMock.mockResolvedValue(gestor);
    const run = (ctId: string) =>
      withAccessHandler(req(), 'ct:members:manage', () => ({ ctId }), async () => NextResponse.json({ ok: true }));
    expect((await run('ct-1')).status).toBe(200);
    expect((await run('ct-2')).status).toBe(403);
  });

  it('entrega usuário e ator ao handler e abre contexto RLS (conta NONE vira ANNOTATOR no RLS)', async () => {
    userMock.mockResolvedValue({ id: 'u1', role: 'NONE' });
    actorMock.mockResolvedValue(gestor);
    let seen: { actor: string; rls: string | undefined } | null = null;
    await withAccessHandler(req(), 'athlete:create', null, async ({ actor }) => {
      seen = { actor: actor.userId, rls: getRLSUser()?.role };
      return NextResponse.json({});
    });
    expect(seen).toEqual({ actor: 'u1', rls: 'ANNOTATOR' });
  });

  it('admin mantém role ADMIN no contexto RLS', async () => {
    userMock.mockResolvedValue({ id: 'a1', role: 'ADMIN' });
    actorMock.mockResolvedValue({
      ...gestor,
      userId: 'a1',
      memberships: [{ kind: 'PLATAFORMA', preset: 'ADMIN', ctId: null, status: 'ACTIVE' }],
    });
    let role: string | undefined;
    await withAccessHandler(req(), 'platform:users:manage', null, async () => {
      role = getRLSUser()?.role;
      return NextResponse.json({});
    });
    expect(role).toBe('ADMIN');
  });
});
