import {
  CATEGORIES_BY_RANKING,
  CATEGORY_TO_NUMBER,
  calculateAgeFromYear,
  getCategoriesForAge,
  getAllowedCategoriesForAge,
  getMatchCategoriesForAge,
  getAvailableRankingTypes,
  getClassesForSelection,
  HIGHER_CATEGORY,
} from '../rankingConstants';

describe('rankingConstants - caracterização', () => {
  describe('getCategoriesForAge (comportamento atual)', () => {
    it('retorna categorias cuja faixa contém exatamente a idade', () => {
      expect(getCategoriesForAge('ESTADUAL', 12)).toEqual(['11-12']);
      expect(getCategoriesForAge('ESTADUAL', 14)).toEqual(['13-14']);
      expect(getCategoriesForAge('ESTADUAL', 16)).toEqual(['15-16']);
      expect(getCategoriesForAge('ESTADUAL', 18)).toEqual(['17-18']);
    });

    it('ESTADUAL 11 retorna categoria unica 11 e 11-12', () => {
      expect(getCategoriesForAge('ESTADUAL', 11)).toEqual(['11', '11-12']);
    });

    it('retorna vazio se idade fora das faixas (adulto 19+)', () => {
      expect(getCategoriesForAge('ESTADUAL', 19)).toEqual([]);
      expect(getCategoriesForAge('CBT', 25)).toEqual([]);
    });

    it('respeita categorias disponiveis por ranking type', () => {
      expect(getCategoriesForAge('COSAT', 12)).toEqual([]);
      expect(getCategoriesForAge('ITF', 18)).toEqual(['18']);
      expect(getCategoriesForAge('ITF', 17)).toEqual([]);
    });
  });

  describe('getAllowedCategoriesForAge (libera categoria superior)', () => {
    it('atleta 12 (ESTADUAL) libera 11-12 e 13-14', () => {
      expect(getAllowedCategoriesForAge('ESTADUAL', 12)).toEqual(['11-12', '13-14']);
    });

    it('atleta 14 (ESTADUAL) libera 13-14 e 15-16', () => {
      expect(getAllowedCategoriesForAge('ESTADUAL', 14)).toEqual(['13-14', '15-16']);
    });

    it('atleta 16 (ESTADUAL) libera 15-16 e 17-18', () => {
      expect(getAllowedCategoriesForAge('ESTADUAL', 16)).toEqual(['15-16', '17-18']);
    });

    it('atleta 18 (ESTADUAL) permanece apenas 17-18 (topo)', () => {
      expect(getAllowedCategoriesForAge('ESTADUAL', 18)).toEqual(['17-18']);
    });

    it('atleta 12 (CBT) libera 11-12 e 13-14', () => {
      expect(getAllowedCategoriesForAge('CBT', 12)).toEqual(['11-12', '13-14']);
    });

    it('nao libera categoria superior inexistente no ranking type (COSAT nao tem 17-18)', () => {
      expect(getAllowedCategoriesForAge('COSAT', 14)).toEqual(['13-14', '15-16']);
      expect(getAllowedCategoriesForAge('COSAT', 16)).toEqual(['15-16']);
    });

    it('ITF permanece apenas 18 (nao participa)', () => {
      expect(getAllowedCategoriesForAge('ITF', 18)).toEqual(['18']);
    });

    it('ESTADUAL 11 libera 11, 11-12 e 13-14', () => {
      const result = getAllowedCategoriesForAge('ESTADUAL', 11);
      expect(result).toContain('11');
      expect(result).toContain('11-12');
      expect(result).toContain('13-14');
    });

    it('adulto 19+ continua vazio', () => {
      expect(getAllowedCategoriesForAge('ESTADUAL', 19)).toEqual([]);
    });
  });

  describe('HIGHER_CATEGORY map', () => {
    it('mapeia faixas inferiores para a imediatamente superior', () => {
      expect(HIGHER_CATEGORY['11-12']).toBe('13-14');
      expect(HIGHER_CATEGORY['13-14']).toBe('15-16');
      expect(HIGHER_CATEGORY['15-16']).toBe('17-18');
    });

    it('17-18 nao tem superior', () => {
      expect(HIGHER_CATEGORY['17-18']).toBeUndefined();
    });
  });

  describe('getMatchCategoriesForAge (categoria de partida - libera acima)', () => {
    it('atleta 12 libera INFANTIL e JUVENIL', () => {
      expect(getMatchCategoriesForAge(12)).toEqual(['INFANTIL', 'JUVENIL']);
    });

    it('atleta 14 libera JUVENIL e ADULTO', () => {
      expect(getMatchCategoriesForAge(14)).toEqual(['JUVENIL', 'ADULTO']);
    });

    it('atleta 16 libera JUVENIL e ADULTO', () => {
      expect(getMatchCategoriesForAge(16)).toEqual(['JUVENIL', 'ADULTO']);
    });

    it('atleta 18 libera JUVENIL e ADULTO', () => {
      expect(getMatchCategoriesForAge(18)).toEqual(['JUVENIL', 'ADULTO']);
    });

    it('adulto 19+ retorna vazio (sem restricao UX - escolhe livremente)', () => {
      expect(getMatchCategoriesForAge(19)).toEqual([]);
      expect(getMatchCategoriesForAge(30)).toEqual([]);
    });

    it('idade abaixo de 11 retorna vazio', () => {
      expect(getMatchCategoriesForAge(10)).toEqual([]);
    });
  });

  describe('getAvailableRankingTypes', () => {
    it('ESTADUAL sempre disponivel', () => {
      expect(getAvailableRankingTypes(25)).toContain('ESTADUAL');
    });

    it('ATP/WTA sempre disponiveis', () => {
      expect(getAvailableRankingTypes(25)).toContain('ATP');
      expect(getAvailableRankingTypes(25)).toContain('WTA');
    });
  });

  describe('getClassesForSelection', () => {
    it('retorna classes para idade valida', () => {
      const classes = getClassesForSelection('13-14', 'MALE', 13);
      expect(classes.length).toBeGreaterThan(0);
      classes.forEach((c) => expect(c).toMatch(/^(\d)ªM[A-C]$/));
    });
  });
});

describe('calculateAgeFromYear', () => {
  it('subtrai ano corrente pelo ano de nascimento', () => {
    const year = 2000;
    const expected = new Date().getFullYear() - year;
    expect(calculateAgeFromYear(year)).toBe(expected);
  });
});

describe('constantes de categoria', () => {
  it('CATEGORIES_BY_RANKING tem ESTADUAL/CBT/COSAT/ITF', () => {
    expect(Object.keys(CATEGORIES_BY_RANKING)).toEqual(
      expect.arrayContaining(['ESTADUAL', 'CBT', 'COSAT', 'ITF'])
    );
  });

  it('CATEGORY_TO_NUMBER mapeia ordinais', () => {
    expect(CATEGORY_TO_NUMBER['11-12']).toBe(1);
    expect(CATEGORY_TO_NUMBER['13-14']).toBe(2);
    expect(CATEGORY_TO_NUMBER['15-16']).toBe(3);
    expect(CATEGORY_TO_NUMBER['17-18']).toBe(4);
  });
});
