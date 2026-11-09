import { AREA_PREFIXES, type AreaCode } from '@/core/access/areas';
import { appPath, isNeutralRoute } from '@/core/access/app-path.logic';

describe('area-links.guard.test.ts - Teste-Guarda de Integridade de Links', () => {
  const ALL_AREAS = Object.keys(AREA_PREFIXES) as AreaCode[];
  const PREFIXED_SUBPAGES = [
    '/partidasaovivo',
    '/partidasanotadas',
    '/aguardandoanotador',
    '/historico',
    '/atletas',
    '/relatorios',
    '/match/new',
    '/match/123/scoring',
    '/match/123/report',
  ];

  it('garante que todos os 8 prefixos de área são únicos e iniciam com barra', () => {
    const prefixes = Object.values(AREA_PREFIXES);
    const unique = new Set(prefixes);
    expect(unique.size).toBe(prefixes.length);
    prefixes.forEach((p) => {
      expect(p.startsWith('/')).toBe(true);
      expect(p.endsWith('/')).toBe(false);
    });
  });

  it('garante que appPath prefixa corretamente todas as subpáginas em todas as 8 áreas', () => {
    for (const area of ALL_AREAS) {
      const prefix = AREA_PREFIXES[area];
      for (const page of PREFIXED_SUBPAGES) {
        const resolved = appPath(area, page);
        expect(resolved.startsWith(prefix)).toBe(true);
        expect(resolved).toBe(`${prefix}${page}`);
      }
    }
  });

  it('garante que / e /dashboard mapeiam exatamente para a home da área ativa', () => {
    for (const area of ALL_AREAS) {
      const prefix = AREA_PREFIXES[area];
      expect(appPath(area, '/')).toBe(prefix);
      expect(appPath(area, '/dashboard')).toBe(prefix);
    }
  });

  it('garante imunidade de rotas neutras e públicas contra prefixação indevida', () => {
    const neutralRoutes = ['/login', '/signup', '/forgot', '/trocar-senha', '/dados-pessoais', '/termos', '/privacidade'];
    for (const area of ALL_AREAS) {
      for (const route of neutralRoutes) {
        expect(isNeutralRoute(route)).toBe(true);
        expect(appPath(area, route)).toBe(route);
      }
    }
  });
});

