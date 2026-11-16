import { computeLoginProfile } from '../login-profile-logic';
import { resolveLoginArea } from '../login-response.logic';
import { homeForProfileString } from '@/core/access/home';
import { homeForArea } from '@/core/access/areas';

describe('Perfil e Roteamento de Responsável Legal no Login', () => {
  it('atribui perfil RESPONSAVEL para usuário que possui dependentes e não é atleta próprio', () => {
    const result = computeLoginProfile(
      [],
      'ANNOTATOR',
      { isGuardian: true, isAthlete: false }
    );
    expect(result.effectiveProfile).toBe('RESPONSAVEL');
    expect(result.effectiveRole).toBe('ANNOTATOR');
  });

  it('preserva papel de GESTOR ou TREINADOR mesmo se tiver dependentes', () => {
    const gestorResult = computeLoginProfile(
      [{ kind: 'GESTOR', ctId: 'ct-1', status: 'ACTIVE' }],
      'ANNOTATOR',
      { isGuardian: true, isAthlete: false }
    );
    expect(gestorResult.effectiveProfile).toBe('GESTOR');

    const coachResult = computeLoginProfile(
      [{ kind: 'TREINADOR', ctId: 'ct-1', status: 'ACTIVE' }],
      'ANNOTATOR',
      { isGuardian: true, isAthlete: false }
    );
    expect(coachResult.effectiveProfile).toBe('TREINADOR');
  });

  it('resolve área de login como RESPONSAVEL quando sem contexto de CT', () => {
    const area = resolveLoginArea(undefined, { isGuardian: true, isAthlete: false });
    expect(area).toBe('RESPONSAVEL');
  });

  it('redireciona perfil RESPONSAVEL diretamente para /responsavel e nunca para /dashboard', () => {
    expect(homeForProfileString('RESPONSAVEL')).toBe('/responsavel');
    expect(homeForArea('RESPONSAVEL')).toBe('/responsavel');
  });
});
