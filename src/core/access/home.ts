import { getProfiles } from './profiles';
import type { Actor } from './types';

/**
 * Retorna a rota de início (home) canônica para cada perfil autenticado.
 * Função pura; sem efeitos colaterais nem I/O.
 */
export function homeForProfile(actor: Actor | null | undefined): string {
  if (!actor || !actor.isActive) return '/login';

  const profiles = getProfiles(actor);
  if (profiles.includes('ADMIN')) return '/admin';
  if (profiles.includes('GESTOR')) return '/gestor';
  if (profiles.includes('TREINADOR')) return '/dashboard';
  if (profiles.includes('ATLETA')) return '/dashboard';
  return '/dashboard';
}

/** Versão para cliente que recebe apenas a string de perfil (do sessionStorage/JWT). */
export function homeForProfileString(profile?: string | null): string {
  switch (profile) {
    case 'ADMIN':
      return '/admin';
    case 'GESTOR':
      return '/gestor';
    case 'TREINADOR':
    case 'ATLETA':
    default:
      return '/dashboard';
  }
}

