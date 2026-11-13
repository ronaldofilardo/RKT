export interface UserWithMemberships {
  name?: string | null;
  role?: string | null;
  memberships?: Array<{ kind: string; ct?: { name: string } | null }> | null;
  athleteProfile?: { id: string } | null;
}

export interface PlayerWithLinks {
  id?: string;
  name?: string;
  club?: string | null;
  coachAthleteLinks?: Array<{ coach: { name: string } }> | null;
}

export function resolveCreatorRoleLabel(user?: UserWithMemberships | null): string {
  if (!user) return 'Externo';
  const gestorMem = user.memberships?.find((m) => m.kind === 'GESTOR');
  if (gestorMem) {
    return gestorMem.ct?.name ? `Gestor (${gestorMem.ct.name})` : 'Gestor';
  }
  const coachMem = user.memberships?.find((m) => m.kind === 'TREINADOR');
  if (coachMem) {
    return coachMem.ct?.name ? `Treinador (${coachMem.ct.name})` : 'Treinador Pessoal';
  }
  if (user.athleteProfile) return 'Atleta';
  return 'Espectador';
}

export function formatCreatorWithRole(
  name?: string | null,
  user?: UserWithMemberships | null,
): { name: string; roleLabel: string; fullLabel: string } {
  const displayName = name || user?.name || 'Criador externo';
  const roleLabel = resolveCreatorRoleLabel(user);
  return {
    name: displayName,
    roleLabel,
    fullLabel: `${displayName} (${roleLabel})`,
  };
}

export function resolvePlayerAffiliation(
  player: PlayerWithLinks,
  isOwnClub: boolean,
): { isOwn: boolean; label: string } {
  if (isOwnClub) {
    return { isOwn: true, label: 'Meu clube' };
  }
  if (player.club) {
    return { isOwn: false, label: player.club };
  }
  const coachName = player.coachAthleteLinks?.[0]?.coach?.name;
  if (coachName) {
    return { isOwn: false, label: `Treinador: ${coachName}` };
  }
  return { isOwn: false, label: 'Avulso' };
}

