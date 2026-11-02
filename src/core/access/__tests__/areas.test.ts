import { listAreas, prefixForArea, homeForArea, AREA_PREFIXES } from '../areas';

describe('areas.ts', () => {
  it('mapeia prefixos canônicos de todas as 8 áreas', () => {
    expect(prefixForArea('ADMIN')).toBe('/admin');
    expect(prefixForArea('SUPORTE')).toBe('/suporte');
    expect(prefixForArea('GESTOR')).toBe('/clube/gestor');
    expect(prefixForArea('TREINADOR_CLUBE')).toBe('/clube/treinador');
    expect(prefixForArea('TREINADOR_AVULSO')).toBe('/treinador');
    expect(prefixForArea('ATLETA')).toBe('/atleta');
    expect(prefixForArea('ANOTADOR')).toBe('/anotador');
    expect(prefixForArea('ESPECTADOR')).toBe('/espectador');
    expect(homeForArea('TREINADOR_AVULSO')).toBe('/treinador');
  });

  it('calcula áreas para admin e suporte', () => {
    const adminAreas = listAreas({ role: 'ADMIN' });
    expect(adminAreas.map((a) => a.code)).toContain('ADMIN');

    const suporteAreas = listAreas({ isSuporte: true });
    expect(suporteAreas.map((a) => a.code)).toContain('SUPORTE');
  });

  it('calcula áreas para gestor e treinador de clube', () => {
    const areas = listAreas({
      memberships: [
        { kind: 'GESTOR', ctId: 'ct-1', ctName: 'Clube Central' },
        { kind: 'TREINADOR', ctId: 'ct-2', ctName: 'CT Raquetes' },
      ],
    });
    expect(areas.find((a) => a.code === 'GESTOR')?.ctId).toBe('ct-1');
    expect(areas.find((a) => a.code === 'TREINADOR_CLUBE')?.ctId).toBe('ct-2');
  });

  it('calcula áreas para treinador particular e atleta', () => {
    const areas = listAreas({
      hasParticularCoach: true,
      athlete: { playerId: 'player-1' },
      canOperate: true,
    });
    const codes = areas.map((a) => a.code);
    expect(codes).toContain('TREINADOR_AVULSO');
    expect(codes).toContain('ATLETA');
    expect(codes).toContain('ANOTADOR');
  });

  it('cai em ESPECTADOR se o usuário não possuir vínculos operacionais', () => {
    const areas = listAreas({});
    expect(areas).toHaveLength(1);
    expect(areas[0].code).toBe('ESPECTADOR');
  });
});

