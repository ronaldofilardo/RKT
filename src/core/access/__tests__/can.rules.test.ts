import { can } from '../can';
import { getProfiles } from '../profiles';
import { deriveLegacyRole } from '../legacy-role';
import { CT, OTHER_CT, actor, member } from './fixtures';

describe('can() — regras gerais', () => {
  it('nega para ator nulo ou inativo', () => {
    expect(can(null, 'athlete:create')).toEqual({ allow: false, reason: 'inactive' });
    const inactive = actor({ isActive: false, canOperate: true });
    expect(can(inactive, 'athlete:create').reason).toBe('inactive');
    expect(getProfiles(inactive)).toEqual([]);
  });

  it('ignora vínculos suspensos ou encerrados', () => {
    const a = actor({
      memberships: [
        member('GESTOR', { ctId: CT, status: 'SUSPENDED' }),
        member('TREINADOR', { ctId: CT, status: 'ENDED' }),
      ],
    });
    expect(getProfiles(a)).toEqual([]);
    expect(can(a, 'ct:members:manage', { ctId: CT }).allow).toBe(false);
  });

  it('GESTOR sem CT não gera perfil', () => {
    expect(getProfiles(actor({ memberships: [member('GESTOR')] }))).toEqual([]);
  });

  it('permissão é a união dos perfis (gestor + treinador + atleta)', () => {
    const a = actor({
      athletePlayerId: 'p-self',
      memberships: [member('GESTOR', { ctId: CT }), member('TREINADOR', { ctId: OTHER_CT })],
    });
    expect(can(a, 'ct:members:manage', { ctId: CT }).allow).toBe(true);
    expect(can(a, 'ct:members:manage', { ctId: OTHER_CT }).allow).toBe(false);
    expect(can(a, 'athlete:update', { ctId: OTHER_CT }).allow).toBe(true);
    expect(can(a, 'athlete:update', { playerId: 'p-self' }).allow).toBe(true);
  });

  it('treinador avulso (sem CT) só atualiza o que criou', () => {
    const a = actor({ memberships: [member('TREINADOR')] });
    expect(can(a, 'athlete:update', { ctId: CT }).allow).toBe(false);
    expect(can(a, 'athlete:update', { ownerUserId: 'u-1' }).allow).toBe(true);
  });

  it('admin não opera partidas, a menos que também tenha canOperate (P4)', () => {
    const admin = actor({ memberships: [member('PLATAFORMA', { preset: 'ADMIN' })] });
    expect(can(admin, 'match:create').allow).toBe(false);
    expect(can({ ...admin, canOperate: true }, 'match:create').allow).toBe(true);
  });

  it('suporte nunca tem match:*', () => {
    const s = actor({ memberships: [member('PLATAFORMA', { preset: 'SUPORTE' })] });
    expect(can(s, 'match:create').allow).toBe(false);
    expect(can(s, 'match:annotate').allow).toBe(false);
  });
});

describe('deriveLegacyRole', () => {
  it.each([
    ['admin', actor({ memberships: [member('PLATAFORMA', { preset: 'ADMIN' })] }), 'ADMIN'],
    ['admin que também opera', actor({ canOperate: true, memberships: [member('PLATAFORMA', { preset: 'ADMIN' })] }), 'ADMIN'],
    ['base operacional', actor({ canOperate: true }), 'ANNOTATOR'],
    ['gestor', actor({ memberships: [member('GESTOR', { ctId: CT })] }), 'ANNOTATOR'],
    ['treinador avulso', actor({ memberships: [member('TREINADOR')] }), 'ANNOTATOR'],
    ['atleta', actor({ athletePlayerId: 'p-1' }), 'ANNOTATOR'],
    ['suporte', actor({ memberships: [member('PLATAFORMA', { preset: 'SUPORTE' })] }), 'NONE'],
    ['conta sem vínculo', actor(), 'NONE'],
    ['inativo', actor({ isActive: false, canOperate: true }), 'NONE'],
  ])('%s → %s', (_n, a, expected) => {
    expect(deriveLegacyRole(a)).toBe(expected);
  });
});
