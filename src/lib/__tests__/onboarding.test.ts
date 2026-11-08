/**
 * @jest-environment jsdom
 */
import {
  isOnboarded,
  markOnboarded,
  onboardingProfileFor,
  onboardingProfileForArea,
  onboardingProfileForRole,
  onboardingStorageKey,
} from '../onboarding';

describe('persistência do onboarding', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('usa a chave rkt_onboarded_<userId>', () => {
    expect(onboardingStorageKey('u-1')).toBe('rkt_onboarded_u-1');
  });

  it('começa pendente e passa a concluído após markOnboarded', () => {
    expect(isOnboarded('u-1')).toBe(false);
    markOnboarded('u-1');
    expect(isOnboarded('u-1')).toBe(true);
    expect(isOnboarded('u-2')).toBe(false);
  });

  it('não quebra quando o localStorage falha', () => {
    const original = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error('bloqueado');
        },
      },
    });

    expect(isOnboarded('u-1')).toBe(true);

    Object.defineProperty(window, 'localStorage', { configurable: true, value: original });
  });
});

describe('mapeamento de perfil', () => {
  it('mapeia áreas ativas', () => {
    expect(onboardingProfileForArea('ATLETA')).toBe('ATLETA');
    expect(onboardingProfileForArea('TREINADOR_CLUBE')).toBe('TREINADOR');
    expect(onboardingProfileForArea('TREINADOR_AVULSO')).toBe('TREINADOR');
    expect(onboardingProfileForArea('GESTOR')).toBe('GESTOR');
    expect(onboardingProfileForArea('ESPECTADOR')).toBe('ESPECTADOR');
    expect(onboardingProfileForArea('ADMIN')).toBeNull();
    expect(onboardingProfileForArea('SUPORTE')).toBeNull();
  });

  it('mapeia perfis textuais como fallback', () => {
    expect(onboardingProfileForRole('ATHLETE')).toBe('ATLETA');
    expect(onboardingProfileForRole('COACH')).toBe('TREINADOR');
    expect(onboardingProfileForRole('MANAGER')).toBe('GESTOR');
    expect(onboardingProfileForRole('SPECTATOR')).toBe('ESPECTADOR');
    expect(onboardingProfileForRole('ANOTADOR')).toBeNull();
  });

  it('prioriza a área ativa e recorre ao perfil', () => {
    expect(onboardingProfileFor('TREINADOR_AVULSO', 'ATLETA')).toBe('TREINADOR');
    expect(onboardingProfileFor(null, 'ATLETA')).toBe('ATLETA');
    expect(onboardingProfileFor(null, null)).toBeNull();
  });
});
