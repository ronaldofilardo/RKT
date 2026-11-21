import {
  resolveAthleteClub,
  resolveCreatorClub,
  mapExternalAthlete,
  collectExternalClubs,
  type PlayerExternal,
} from '../externos-query.logic';
import { formatAthleteRow } from '@/app/suporte/externos-formatters';

describe('Suporte Externos Logic & Formatters', () => {
  const basePlayer: PlayerExternal = {
    id: 'p-1',
    name: 'Atleta Teste',
    club: null,
    city: 'Curitiba',
    state: 'PR',
    gender: 'MALE',
    age: 20,
    rankings: null,
    createdAt: new Date('2026-11-20T10:00:00Z'),
    createdByUserId: 'u-1',
    createdByUser: {
      name: 'Treinador Silva',
      email: 'silva@ct.com',
      memberships: [
        {
          kind: 'TREINADOR',
          ct: { id: 'cmw49xfb600017kwdm0x2g2v5', name: 'CT Principal RKT' },
        },
      ],
    },
  };

  describe('resolveAthleteClub', () => {
    it('deve priorizar o nome do CT em playerCts se existir vínculo ativo', () => {
      const p: PlayerExternal = {
        ...basePlayer,
        club: 'Clube Antigo',
        playerCts: [{ ct: { id: 'cmw49xfb600017kwdm0x2g2v5', name: 'CT Principal RKT' } }],
      };
      expect(resolveAthleteClub(p)).toBe('CT Principal RKT');
    });

    it('deve usar player.club se não houver playerCts', () => {
      const p: PlayerExternal = {
        ...basePlayer,
        club: 'Graciosa Country Club',
        playerCts: [],
      };
      expect(resolveAthleteClub(p)).toBe('Graciosa Country Club');
    });

    it('deve usar o CT do criador como fallback se o atleta não tiver clube definido', () => {
      const p: PlayerExternal = {
        ...basePlayer,
        club: null,
        playerCts: [],
      };
      expect(resolveAthleteClub(p)).toBe('CT Principal RKT');
    });

    it('deve retornar null se não houver nenhum clube nem no atleta nem no criador', () => {
      const p: PlayerExternal = {
        ...basePlayer,
        club: null,
        playerCts: [],
        createdByUser: { name: 'Avulso', email: 'avulso@teste.com', memberships: [] },
      };
      expect(resolveAthleteClub(p)).toBeNull();
    });
  });

  describe('resolveCreatorClub', () => {
    it('deve retornar o nome do CT ativo do criador', () => {
      expect(resolveCreatorClub(basePlayer)).toBe('CT Principal RKT');
    });

    it('deve retornar o campo club legado do criador se não tiver membership com CT', () => {
      const p: PlayerExternal = {
        ...basePlayer,
        createdByUser: {
          name: 'Treinador Legado',
          email: 'legado@teste.com',
          club: 'Clube Legado',
          memberships: [],
        },
      };
      expect(resolveCreatorClub(p)).toBe('Clube Legado');
    });

    it('deve retornar null se o criador não tiver CT nem clube', () => {
      const p: PlayerExternal = {
        ...basePlayer,
        createdByUser: {
          name: 'Treinador Sem CT',
          email: 'sem@teste.com',
          memberships: [],
        },
      };
      expect(resolveCreatorClub(p)).toBeNull();
    });
  });

  describe('mapExternalAthlete & formatAthleteRow', () => {
    it('deve mapear createdByClub e formatar como "Nome (Clube do Criador)"', () => {
      const mapped = mapExternalAthlete(basePlayer);
      expect(mapped.createdByClub).toBe('CT Principal RKT');
      expect(mapped.club).toBe('CT Principal RKT');

      const formatted = formatAthleteRow(mapped);
      expect(formatted.createdBy).toBe('Treinador Silva (CT Principal RKT)');
      expect(formatted.club).toBe('CT Principal RKT');
    });

    it('deve formatar sem parênteses se createdByClub for nulo', () => {
      const p: PlayerExternal = {
        ...basePlayer,
        createdByUser: { name: 'Treinador Avulso', email: 'avulso@teste.com', memberships: [] },
      };
      const mapped = mapExternalAthlete(p);
      const formatted = formatAthleteRow(mapped);
      expect(formatted.createdBy).toBe('Treinador Avulso');
    });
  });

  describe('collectExternalClubs', () => {
    it('deve coletar clubes resolvidos no conjunto', () => {
      const clubs = collectExternalClubs([basePlayer]);
      expect(clubs.has('CT Principal RKT')).toBe(true);
    });
  });
});
