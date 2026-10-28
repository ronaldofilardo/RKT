import { isMinor, type MeAccess } from '@/core/access';

/** Subconjunto da linha de `User` necessário para o contexto de menu/perfil. */
export interface MeAccessRow {
  role?: string | null;
  canOperate?: boolean | null;
  memberships?: { kind: string; preset?: string | null; ctId?: string | null }[] | null;
  athleteProfile?: {
    id: string;
    birthDate: Date | null;
    playerCts?: { ctId: string }[] | null;
  } | null;
}

/**
 * Campos aditivos de GET /api/auth/me (Fase 1 do plano de menus).
 * Recebe apenas vínculos ATIVOS. Campos ausentes na linha caem em valores seguros.
 */
export function buildMeAccess(row: MeAccessRow, now: Date = new Date()): MeAccess {
  const memberships = row.memberships ?? [];
  const isPlatform = (preset: string) =>
    memberships.some((m) => m.kind === 'PLATAFORMA' && m.preset === preset);
  const coachMemberships = memberships.filter((m) => m.kind === 'TREINADOR');
  const athlete = row.athleteProfile;

  return {
    canOperate: row.canOperate ?? false,
    isAdmin: row.role === 'ADMIN' || isPlatform('ADMIN'),
    isSuporte: isPlatform('SUPORTE'),
    athlete: athlete
      ? {
          playerId: athlete.id,
          ctIds: (athlete.playerCts ?? []).map((link) => link.ctId),
          isMinor: isMinor(athlete.birthDate, now),
        }
      : null,
    coach: coachMemberships.length
      ? {
          ctIds: coachMemberships
            .map((m) => m.ctId)
            .filter((ctId): ctId is string => !!ctId),
        }
      : null,
  };
}
