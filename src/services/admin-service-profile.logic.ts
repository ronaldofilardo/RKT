export interface UserAccessData {
  id: string;
  name: string;
  email: string;
  cpf?: string | null;
  role: string;
  club?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  canOperate?: boolean;
  memberships?: Array<{ kind: string; preset?: string | null; status: string; ct?: { name: string } | null }> | null;
  athleteProfile?: { id: string; club?: string | null; playerCts?: Array<{ status: string; ct?: { name: string } | null }> | null } | null;
}

export interface FormattedAdminUser {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: string;
  profile: string;
  club: string;
  isActive: boolean;
  createdAt: string;
}

export function deriveUserProfile(user: UserAccessData): string {
  if (user.role === 'ADMIN') return 'ADMIN';
  const active = (user.memberships || []).filter((m) => m.status === 'ACTIVE');
  if (active.some((m) => m.kind === 'PLATAFORMA' && m.preset === 'ADMIN')) return 'ADMIN';
  if (active.some((m) => m.kind === 'PLATAFORMA' && m.preset === 'SUPORTE')) return 'Suporte';
  if (active.some((m) => m.kind === 'GESTOR')) return 'Responsavel/gestor de clube';
  const coach = active.find((m) => m.kind === 'TREINADOR');
  if (coach) return coach.ct ? 'Treinador de clube' : 'Treinador avulso';

  if (user.athleteProfile) {
    const activeCts = (user.athleteProfile.playerCts || []).filter((pc) => pc.status === 'ACTIVE');
    return activeCts.length > 0 || user.athleteProfile.club ? 'Atleta vinculado a clube' : 'Atleta avulso';
  }
  return 'Anotador';
}

export function deriveUserClub(user: UserAccessData): string {
  const active = (user.memberships || []).filter((m) => m.status === 'ACTIVE');
  const gestor = active.find((m) => m.kind === 'GESTOR' && m.ct?.name);
  if (gestor?.ct?.name) return gestor.ct.name;

  const coach = active.find((m) => m.kind === 'TREINADOR' && m.ct?.name);
  if (coach?.ct?.name) return coach.ct.name;

  if (user.athleteProfile) {
    const activeCts = (user.athleteProfile.playerCts || []).filter((pc) => pc.status === 'ACTIVE' && pc.ct?.name);
    if (activeCts.length > 0) return activeCts.map((pc) => pc.ct!.name).join(', ');
    if (user.athleteProfile.club) return user.athleteProfile.club;
  }
  if (user.role === 'ADMIN' && user.club) return user.club;
  return '-';
}

export function formatAdminUser(user: UserAccessData): FormattedAdminUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    cpf: user.cpf || '-',
    role: user.role,
    profile: deriveUserProfile(user),
    club: deriveUserClub(user),
    isActive: user.isActive,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt),
  };
}
