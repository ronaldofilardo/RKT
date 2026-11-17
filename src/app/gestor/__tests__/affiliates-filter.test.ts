import type { AffiliateAthleteItem } from '../affiliates.types';
import {
  extractUniqueClubs,
  extractUniqueStates,
  extractUniqueRankingOrgs,
  filterAffiliateAthletes,
  INITIAL_AFFILIATES_FILTERS,
} from '../affiliates-filter.logic';

const mockAthletes: AffiliateAthleteItem[] = [
  {
    id: '1', name: 'Carlos Alcaraz', nickname: 'carlitos',
    clubName: 'CT Morumbi', coachName: 'Ferrero', dominance: 'RIGHT',
    backhand: 'TWO_HANDED', gender: 'MALE', age: 21,
    city: 'São Paulo', state: 'SP',
    rankings: { atp: { position: 1 }, cbt: { position: 1 } },
  },
  {
    id: '2', name: 'Bia Haddad', nickname: 'biahaddad',
    clubName: 'Pinheiros', coachName: null, dominance: 'LEFT',
    backhand: 'TWO_HANDED', gender: 'FEMALE', age: 28,
    city: 'Curitiba', state: 'PR',
    rankings: { wta: { position: 12 }, cbt: { position: 2 } },
  },
  {
    id: '3', name: 'João Fonseca', nickname: 'fonsequinha',
    clubName: null, coachName: 'Treinador X', dominance: 'RIGHT',
    backhand: 'TWO_HANDED', gender: 'MALE', age: 18,
    city: 'Rio de Janeiro', state: 'RJ',
    rankings: { itf: { position: 1 } },
  },
  {
    id: '4', name: 'Atleta Avulso', nickname: null,
    clubName: null, coachName: null, dominance: null,
    backhand: null, gender: null, age: null,
    city: null, state: null,
    rankings: null,
  },
];

describe('affiliates-filter.logic', () => {
  it('extrai clubes, estados e organizações de rankings sem duplicatas', () => {
    expect(extractUniqueClubs(mockAthletes)).toEqual(['CT Morumbi', 'Pinheiros']);
    expect(extractUniqueStates(mockAthletes)).toEqual(['PR', 'RJ', 'SP']);
    expect(extractUniqueRankingOrgs(mockAthletes)).toEqual(['ATP', 'CBT', 'ITF', 'WTA']);
  });

  it('filtra por afiliação: com clube, com treinador, avulso ou clube específico', () => {
    let res = filterAffiliateAthletes(mockAthletes, { ...INITIAL_AFFILIATES_FILTERS, affiliation: 'WITH_CLUB' });
    expect(res.map((a) => a.id)).toEqual(['1', '2']);

    res = filterAffiliateAthletes(mockAthletes, { ...INITIAL_AFFILIATES_FILTERS, affiliation: 'WITH_COACH' });
    expect(res.map((a) => a.id)).toEqual(['1', '3']);

    res = filterAffiliateAthletes(mockAthletes, { ...INITIAL_AFFILIATES_FILTERS, affiliation: 'UNAFFILIATED' });
    expect(res.map((a) => a.id)).toEqual(['4']);

    res = filterAffiliateAthletes(mockAthletes, { ...INITIAL_AFFILIATES_FILTERS, affiliation: 'CLUB:Pinheiros' });
    expect(res.map((a) => a.id)).toEqual(['2']);
  });

  it('filtra por localidade: estado específico ou sem localidade', () => {
    let res = filterAffiliateAthletes(mockAthletes, { ...INITIAL_AFFILIATES_FILTERS, location: 'STATE:SP' });
    expect(res.map((a) => a.id)).toEqual(['1']);

    res = filterAffiliateAthletes(mockAthletes, { ...INITIAL_AFFILIATES_FILTERS, location: 'NONE' });
    expect(res.map((a) => a.id)).toEqual(['4']);
  });

  it('filtra por rankings: com ranking, sem ranking ou entidade específica', () => {
    let res = filterAffiliateAthletes(mockAthletes, { ...INITIAL_AFFILIATES_FILTERS, ranking: 'WITH_RANKING' });
    expect(res.map((a) => a.id)).toEqual(['1', '2', '3']);

    res = filterAffiliateAthletes(mockAthletes, { ...INITIAL_AFFILIATES_FILTERS, ranking: 'WITHOUT_RANKING' });
    expect(res.map((a) => a.id)).toEqual(['4']);

    res = filterAffiliateAthletes(mockAthletes, { ...INITIAL_AFFILIATES_FILTERS, ranking: 'ORG:WTA' });
    expect(res.map((a) => a.id)).toEqual(['2']);
  });

  it('combina filtros com busca por texto', () => {
    const res = filterAffiliateAthletes(mockAthletes, {
      search: 'Carlos',
      affiliation: 'WITH_CLUB',
      location: 'STATE:SP',
      ranking: 'ORG:ATP',
    });
    expect(res.map((a) => a.id)).toEqual(['1']);
  });
});
