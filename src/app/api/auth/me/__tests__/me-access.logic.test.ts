import { buildMeAccess } from '../me-access.logic';

const NOW = new Date('2026-10-26T12:00:00Z');

describe('buildMeAccess', () => {
  it('linha vazia → valores seguros (sem perfis extras)', () => {
    expect(buildMeAccess({}, NOW)).toEqual({
      canOperate: false,
      isAdmin: false,
      isSuporte: false,
      athlete: null,
      coach: null,
    });
  });

  it('canOperate vem da conta', () => {
    expect(buildMeAccess({ canOperate: true }, NOW).canOperate).toBe(true);
  });

  it('ADMIN por role legado ou por preset de plataforma', () => {
    expect(buildMeAccess({ role: 'ADMIN' }, NOW).isAdmin).toBe(true);
    const viaPreset = buildMeAccess(
      { role: 'ANNOTATOR', memberships: [{ kind: 'PLATAFORMA', preset: 'ADMIN' }] },
      NOW,
    );
    expect(viaPreset.isAdmin).toBe(true);
    expect(viaPreset.isSuporte).toBe(false);
  });

  it('SUPORTE só pelo preset de plataforma', () => {
    const me = buildMeAccess({ memberships: [{ kind: 'PLATAFORMA', preset: 'SUPORTE' }] }, NOW);
    expect(me.isSuporte).toBe(true);
    expect(me.isAdmin).toBe(false);
  });

  it('treinador avulso: ctIds vazio; treinador de clube: lista os CTs', () => {
    expect(buildMeAccess({ memberships: [{ kind: 'TREINADOR', ctId: null }] }, NOW).coach)
      .toEqual({ ctIds: [] });
    const clube = buildMeAccess(
      { memberships: [{ kind: 'TREINADOR', ctId: 'ct-1' }, { kind: 'TREINADOR', ctId: 'ct-2' }] },
      NOW,
    );
    expect(clube.coach).toEqual({ ctIds: ['ct-1', 'ct-2'] });
  });

  it('vínculo GESTOR não gera coach', () => {
    expect(buildMeAccess({ memberships: [{ kind: 'GESTOR', ctId: 'ct-1' }] }, NOW).coach)
      .toBeNull();
  });

  it('atleta avulso: sem PlayerCT; adulto não é menor', () => {
    const me = buildMeAccess(
      { athleteProfile: { id: 'p-1', birthDate: new Date('1990-01-01T00:00:00Z'), playerCts: [] } },
      NOW,
    );
    expect(me.athlete).toEqual({ playerId: 'p-1', ctIds: [], isMinor: false });
  });

  it('atleta de clube e menor de idade', () => {
    const me = buildMeAccess(
      {
        athleteProfile: {
          id: 'p-2',
          birthDate: new Date('2015-05-05T00:00:00Z'),
          playerCts: [{ ctId: 'ct-1' }],
        },
      },
      NOW,
    );
    expect(me.athlete).toEqual({ playerId: 'p-2', ctIds: ['ct-1'], isMinor: true });
  });

  it('atleta sem data de nascimento é tratado como menor (proteção)', () => {
    const me = buildMeAccess({ athleteProfile: { id: 'p-3', birthDate: null } }, NOW);
    expect(me.athlete).toEqual({ playerId: 'p-3', ctIds: [], isMinor: true });
  });
});
