import { appPath, isNeutralRoute } from '../app-path.logic';

describe('appPath.logic.ts', () => {
  it('reconhece rotas neutras', () => {
    expect(isNeutralRoute('/login')).toBe(true);
    expect(isNeutralRoute('/signup')).toBe(true);
    expect(isNeutralRoute('/termos')).toBe(true);
    expect(isNeutralRoute('/privacidade')).toBe(true);
    expect(isNeutralRoute('/api/auth/me')).toBe(true);
    expect(isNeutralRoute('/matches/acompanhar/123')).toBe(true);
    expect(isNeutralRoute('/partidasaovivo')).toBe(false);
  });

  it('mantém rotas neutras inalteradas com qualquer área', () => {
    expect(appPath('TREINADOR_AVULSO', '/login')).toBe('/login');
    expect(appPath('ATLETA', '/dados-pessoais')).toBe('/dados-pessoais');
    expect(appPath('GESTOR', '/termos')).toBe('/termos');
    expect(appPath('ADMIN', '/matches/convite/token123')).toBe('/matches/convite/token123');
  });

  it('constrói home e subpáginas com o prefixo da área', () => {
    expect(appPath('TREINADOR_AVULSO', '/')).toBe('/treinador');
    expect(appPath('TREINADOR_AVULSO', '/dashboard')).toBe('/treinador');
    expect(appPath('TREINADOR_AVULSO', '/partidasaovivo')).toBe('/treinador/partidasaovivo');
    expect(appPath('TREINADOR_AVULSO', '/match/new')).toBe('/treinador/match/new');

    expect(appPath('ATLETA', '/dashboard')).toBe('/atleta');
    expect(appPath('ATLETA', '/atletas')).toBe('/atleta/atletas');

    expect(appPath('TREINADOR_CLUBE', '/historico')).toBe('/clube/treinador/historico');
    expect(appPath('GESTOR', '/dashboard')).toBe('/clube/gestor');
  });

  it('substitui prefixo de outra área pelo prefixo da área ativa', () => {
    expect(appPath('ATLETA', '/treinador/partidasaovivo')).toBe('/atleta/partidasaovivo');
    expect(appPath('TREINADOR_AVULSO', '/clube/gestor/atletas')).toBe('/treinador/atletas');
  });

  it('não duplica prefixo se o caminho já estiver correto', () => {
    expect(appPath('TREINADOR_AVULSO', '/treinador/partidasaovivo')).toBe('/treinador/partidasaovivo');
    expect(appPath('ATLETA', '/atleta')).toBe('/atleta');
  });
});

