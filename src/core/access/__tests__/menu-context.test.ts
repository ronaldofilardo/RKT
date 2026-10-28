import { menuContextFromMe, type MeResponseLike } from '../menu-context';

const base: MeResponseLike = {
  user: { role: 'ANNOTATOR', mustChangePassword: false },
  memberships: [],
  ctStatus: null,
};

describe('menuContextFromMe', () => {
  it('resposta antiga (sem campos novos) → contexto seguro', () => {
    expect(menuContextFromMe(base)).toEqual({
      isActive: true,
      mustChangePassword: false,
      canOperate: false,
      isAdmin: false,
      isSuporte: false,
      gestor: null,
      coach: null,
      athlete: null,
    });
  });

  it('role legado ADMIN vale como admin quando isAdmin não veio', () => {
    const ctx = menuContextFromMe({ ...base, user: { role: 'ADMIN', mustChangePassword: false } });
    expect(ctx.isAdmin).toBe(true);
  });

  it('isAdmin explícito prevalece sobre o role', () => {
    const ctx = menuContextFromMe({
      ...base,
      user: { role: 'ADMIN', mustChangePassword: false },
      isAdmin: false,
    });
    expect(ctx.isAdmin).toBe(false);
  });

  it('gestor: usa vínculos GESTOR ativos com CT e o ctStatus do /me', () => {
    const ctx = menuContextFromMe({
      ...base,
      ctStatus: 'PENDING',
      memberships: [
        { kind: 'GESTOR', ctId: 'ct-1', status: 'ACTIVE' },
        { kind: 'TREINADOR', ctId: 'ct-9', status: 'ACTIVE' },
      ],
    });
    expect(ctx.gestor).toEqual({ ctIds: ['ct-1'], ctStatus: 'PENDING' });
  });

  it('GESTOR sem CT ou não ativo não gera contexto de gestor', () => {
    const ctx = menuContextFromMe({
      ...base,
      memberships: [
        { kind: 'GESTOR', ctId: null, status: 'ACTIVE' },
        { kind: 'GESTOR', ctId: 'ct-1', status: 'SUSPENDED' },
      ],
    });
    expect(ctx.gestor).toBeNull();
  });

  it('propaga mustChangePassword, coach e athlete', () => {
    const ctx = menuContextFromMe({
      ...base,
      user: { role: 'ANNOTATOR', mustChangePassword: true },
      coach: { ctIds: [] },
      athlete: { playerId: 'p-1', ctIds: [], isMinor: false },
    });
    expect(ctx.mustChangePassword).toBe(true);
    expect(ctx.coach).toEqual({ ctIds: [] });
    expect(ctx.athlete?.playerId).toBe('p-1');
  });
});
