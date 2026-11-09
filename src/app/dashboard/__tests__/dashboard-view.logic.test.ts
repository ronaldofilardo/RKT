import { normalizeDashboardPath, resolveDashboardView } from '../dashboard-view.logic';

describe('dashboard-view.logic', () => {
  describe('normalizeDashboardPath', () => {
    it('retorna / para valores vazios ou nulos', () => {
      expect(normalizeDashboardPath(null)).toBe('/');
      expect(normalizeDashboardPath('')).toBe('/');
    });

    it('retorna a própria rota quando não possui prefixo de área', () => {
      expect(normalizeDashboardPath('/historico')).toBe('/historico');
      expect(normalizeDashboardPath('/relatorios')).toBe('/relatorios');
      expect(normalizeDashboardPath('/dashboard')).toBe('/dashboard');
    });

    it('remove prefixo de área de clube/treinador', () => {
      expect(normalizeDashboardPath('/clube/treinador/historico')).toBe('/historico');
      expect(normalizeDashboardPath('/clube/treinador/relatorios')).toBe('/relatorios');
      expect(normalizeDashboardPath('/clube/treinador')).toBe('/dashboard');
    });

    it('remove prefixo de área de atleta', () => {
      expect(normalizeDashboardPath('/atleta/historico')).toBe('/historico');
      expect(normalizeDashboardPath('/atleta/relatorios')).toBe('/relatorios');
      expect(normalizeDashboardPath('/atleta')).toBe('/dashboard');
    });

    it('remove prefixo de área de treinador avulso', () => {
      expect(normalizeDashboardPath('/treinador/historico')).toBe('/historico');
      expect(normalizeDashboardPath('/treinador/relatorios')).toBe('/relatorios');
    });

    it('remove prefixo de área de gestor de clube', () => {
      expect(normalizeDashboardPath('/clube/gestor/historico')).toBe('/historico');
    });
  });

  describe('resolveDashboardView', () => {
    it('resolve history em rotas legadas e prefixadas', () => {
      expect(resolveDashboardView('/historico')).toBe('history');
      expect(resolveDashboardView('/clube/treinador/historico')).toBe('history');
      expect(resolveDashboardView('/atleta/historico')).toBe('history');
      expect(resolveDashboardView('/treinador/historico')).toBe('history');
    });

    it('resolve reports em rotas legadas e prefixadas', () => {
      expect(resolveDashboardView('/relatorios')).toBe('reports');
      expect(resolveDashboardView('/clube/treinador/relatorios')).toBe('reports');
      expect(resolveDashboardView('/atleta/relatorios')).toBe('reports');
    });

    it('resolve views operacionais prefixadas', () => {
      expect(resolveDashboardView('/clube/treinador/partidasanotadas')).toBe('annotated');
      expect(resolveDashboardView('/clube/treinador/partidasaovivo')).toBe('live');
      expect(resolveDashboardView('/clube/treinador/aguardandoanotador')).toBe('pending');
    });

    it('resolve dashboard padrão na raiz ou prefixo exato', () => {
      expect(resolveDashboardView('/dashboard')).toBe('dashboard');
      expect(resolveDashboardView('/clube/treinador')).toBe('dashboard');
      expect(resolveDashboardView(null)).toBe('dashboard');
    });
  });
});

