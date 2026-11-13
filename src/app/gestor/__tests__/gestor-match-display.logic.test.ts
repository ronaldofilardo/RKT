import {
  resolveCreatorRoleLabel,
  formatCreatorWithRole,
  resolvePlayerAffiliation,
} from '../gestor-match-display.logic';

describe('gestor-match-display.logic', () => {
  describe('resolveCreatorRoleLabel', () => {
    it('retorna Externo quando usuário é nulo', () => {
      expect(resolveCreatorRoleLabel(null)).toBe('Externo');
    });

    it('identifica Gestor com ou sem CT', () => {
      expect(
        resolveCreatorRoleLabel({
          memberships: [{ kind: 'GESTOR', ct: { name: 'CT Morumbi' } }],
        }),
      ).toBe('Gestor (CT Morumbi)');

      expect(
        resolveCreatorRoleLabel({
          memberships: [{ kind: 'GESTOR', ct: null }],
        }),
      ).toBe('Gestor');
    });

    it('identifica Treinador de clube ou Treinador Pessoal', () => {
      expect(
        resolveCreatorRoleLabel({
          memberships: [{ kind: 'TREINADOR', ct: { name: 'Clube Pinheiros' } }],
        }),
      ).toBe('Treinador (Clube Pinheiros)');

      expect(
        resolveCreatorRoleLabel({
          memberships: [{ kind: 'TREINADOR', ct: null }],
        }),
      ).toBe('Treinador Pessoal');
    });

    it('identifica Atleta quando tem athleteProfile', () => {
      expect(
        resolveCreatorRoleLabel({
          memberships: [],
          athleteProfile: { id: 'player-1' },
        }),
      ).toBe('Atleta');
    });

    it('retorna Espectador para usuário sem memberships nem athleteProfile', () => {
      expect(
        resolveCreatorRoleLabel({
          memberships: [],
          athleteProfile: null,
        }),
      ).toBe('Espectador');
    });
  });

  describe('formatCreatorWithRole', () => {
    it('combina nome e papel do criador', () => {
      const res = formatCreatorWithRole('Carlos', {
        memberships: [{ kind: 'TREINADOR', ct: null }],
      });
      expect(res.name).toBe('Carlos');
      expect(res.roleLabel).toBe('Treinador Pessoal');
      expect(res.fullLabel).toBe('Carlos (Treinador Pessoal)');
    });
  });

  describe('resolvePlayerAffiliation', () => {
    it('retorna Meu clube quando o atleta pertence ao clube do gestor', () => {
      const res = resolvePlayerAffiliation({ name: 'Atleta A' }, true);
      expect(res.isOwn).toBe(true);
      expect(res.label).toBe('Meu clube');
    });

    it('retorna o clube cadastrado para atleta de outro clube', () => {
      const res = resolvePlayerAffiliation({ name: 'Atleta B', club: 'Paulistano' }, false);
      expect(res.isOwn).toBe(false);
      expect(res.label).toBe('Paulistano');
    });

    it('retorna o nome do treinador pessoal quando o atleta não tem clube mas tem CoachAthleteLink', () => {
      const res = resolvePlayerAffiliation(
        {
          name: 'Atleta C',
          club: null,
          coachAthleteLinks: [{ coach: { name: 'Treinador Roberto' } }],
        },
        false,
      );
      expect(res.isOwn).toBe(false);
      expect(res.label).toBe('Treinador: Treinador Roberto');
    });

    it('retorna Avulso para atleta sem clube e sem treinador', () => {
      const res = resolvePlayerAffiliation({ name: 'Atleta D', club: null }, false);
      expect(res.isOwn).toBe(false);
      expect(res.label).toBe('Avulso');
    });
  });
});
