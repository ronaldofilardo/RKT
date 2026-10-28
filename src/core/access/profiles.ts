import type { Actor, Profile } from './types';

/** Perfis ativos do ator = união dos vínculos ativos (F2). Conta inativa não tem perfil. */
export function getProfiles(actor: Actor): Profile[] {
  if (!actor.isActive) return [];
  const profiles = new Set<Profile>();
  for (const m of actor.memberships) {
    if (m.status !== 'ACTIVE') continue;
    if (m.kind === 'PLATAFORMA' && m.preset === 'ADMIN') profiles.add('ADMIN');
    if (m.kind === 'PLATAFORMA' && m.preset === 'SUPORTE') profiles.add('SUPORTE');
    if (m.kind === 'GESTOR' && m.ctId) profiles.add('GESTOR');
    if (m.kind === 'TREINADOR') profiles.add('TREINADOR');
  }
  if (actor.athletePlayerId) profiles.add('ATLETA');
  if (actor.guardianOfPlayerIds.length) profiles.add('RESPONSAVEL');
  if (actor.canOperate) profiles.add('OPERACIONAL');
  return [...profiles];
}
