import { homeForProfile, homeForProfileString } from '../home';
import type { Actor } from '../types';

describe('homeForProfile / homeForProfileString', () => {
  const baseActor: Actor = {
    userId: 'u1',
    isActive: true,
    canOperate: false,
    memberships: [],
    athleteCtIds: [],
    guardianOfPlayerIds: [],
    followedPlayerIds: [],
  };

  it('direciona usuário não autenticado para /login', () => {
    expect(homeForProfile(null)).toBe('/login');
    expect(homeForProfile({ ...baseActor, isActive: false })).toBe('/login');
  });

  it('direciona perfis administrativos canônicos', () => {
    expect(homeForProfileString('ADMIN')).toBe('/admin');
    expect(homeForProfileString('SUPORTE')).toBe('/suporte');
    expect(homeForProfileString('GESTOR')).toBe('/gestor');
    expect(homeForProfileString('RESPONSAVEL')).toBe('/responsavel');
    expect(homeForProfileString('TREINADOR')).toBe('/dashboard');
    expect(homeForProfileString('ATLETA')).toBe('/dashboard');
    expect(homeForProfileString(null)).toBe('/dashboard');
  });

  it('direciona responsável legal puro para /responsavel', () => {
    const actor: Actor = {
      ...baseActor,
      guardianOfPlayerIds: ['p-minor-1'],
    };
    expect(homeForProfile(actor)).toBe('/responsavel');
  });
});
