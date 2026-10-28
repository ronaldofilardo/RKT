import type { Actor, ActorMembership } from '../types';
import { actorCtIds, resolvePoolScope, maskNameForMinor, toPoolPlayerView } from '../pool';

const membership = (kind: ActorMembership['kind'], ctId: string | null): ActorMembership => ({
  kind,
  preset: null,
  ctId,
  status: 'ACTIVE',
});

const actor = (memberships: ActorMembership[], athleteCtIds: string[] = []): Actor => ({
  userId: 'u-1',
  isActive: true,
  canOperate: true,
  memberships,
  athletePlayerId: 'p-1',
  athleteCtIds,
  guardianOfPlayerIds: [],
  followedPlayerIds: [],
});

describe('Core Access: pool (regras puras)', () => {
  it('actorCtIds retorna CTs ativos de gestor e treinador sem duplicar', () => {
    const a = actor([
      membership('GESTOR', 'ct-1'),
      membership('TREINADOR', 'ct-1'),
      membership('TREINADOR', 'ct-2'),
      membership('SUSPENDED', 'ct-3'),
    ]);
    expect(actorCtIds(a)).toEqual(['ct-1', 'ct-2']);
  });

  it('actorCtIds ignora ctId nulo', () => {
    const a = actor([membership('GESTOR', null), membership('TREINADOR', 'ct-1')]);
    expect(actorCtIds(a)).toEqual(['ct-1']);
  });

  it('actorCtIds inclui athleteCtIds do atleta', () => {
    const a = actor([], ['ct-5', 'ct-1']);
    expect(actorCtIds(a)).toEqual(expect.arrayContaining(['ct-1', 'ct-5']));
  });

  it('resolvePoolScope com meu clube false devolve ANY (pool global)', () => {
    const a = actor([membership('GESTOR', 'ct-1')]);
    expect(resolvePoolScope(a, false)).toEqual({ kind: 'ANY', ctIds: [] });
  });

  it('resolvePoolScope com meu clube true e CTs devolve CT com os IDs', () => {
    const a = actor([membership('GESTOR', 'ct-1'), membership('TREINADOR', 'ct-2')]);
    expect(resolvePoolScope(a, true)).toEqual({ kind: 'CT', ctIds: ['ct-1', 'ct-2'] });
  });

  it('resolvePoolScope com meu clube true sem CTs cai para ANY', () => {
    const a = actor([]);
    expect(resolvePoolScope(a, true)).toEqual({ kind: 'ANY', ctIds: [] });
  });

  it('resolvePoolScope com actor nulo devolve ANY', () => {
    expect(resolvePoolScope(null, true)).toEqual({ kind: 'ANY', ctIds: [] });
  });

  it('maskNameForMinor preserva a inicial e mascara o restante', () => {
    expect(maskNameForMinor('Maria')).toBe('M***');
    expect(maskNameForMinor('Joao Silva')).toBe('J***');
    expect(maskNameForMinor('X')).toBe('X***');
  });

  it('toPoolPlayerView adulto devolve dados minimos completos', () => {
    const view = toPoolPlayerView(
      {
        id: 'p-1',
        name: 'Joao Silva',
        birthDate: new Date('1990-01-01T00:00:00Z'),
        athleteCode: 'ABC12345',
        club: 'Clube A',
      },
      new Date('2026-10-27T00:00:00Z'),
    );
    expect(view).toEqual({
      id: 'p-1',
      name: 'Joao Silva',
      athleteCode: 'ABC12345',
      club: 'Clube A',
      minor: false,
    });
  });

  it('toPoolPlayerView menor mascara nome e remove clube/codigo', () => {
    const view = toPoolPlayerView(
      {
        id: 'p-2',
        name: 'Maria Menor',
        birthDate: new Date('2015-01-01T00:00:00Z'),
        athleteCode: 'XYZ99999',
        club: 'Clube B',
      },
      new Date('2026-10-27T00:00:00Z'),
    );
    expect(view).toEqual({
      id: 'p-2',
      name: 'M***',
      athleteCode: null,
      club: null,
      minor: true,
    });
  });

  it('toPoolPlayerView sem data de nascimento trata como menor', () => {
    const view = toPoolPlayerView(
      { id: 'p-3', name: 'Sem Nascimento', birthDate: null, athleteCode: null, club: null },
      new Date('2026-10-27T00:00:00Z'),
    );
    expect(view.minor).toBe(true);
    expect(view.name).toBe('S***');
  });
});
