/**
 * Projeção Prisma para carregar o ator de autorização em accessService.ts.
 */
export const ACTOR_USER_SELECT = {
  id: true,
  role: true,
  isActive: true,
  canOperate: true,
  memberships: {
    where: { status: 'ACTIVE' as const },
    select: { kind: true, preset: true, ctId: true, status: true },
  },
  athleteProfile: { select: { id: true, playerCts: { select: { ctId: true } } } },
  guardianLinks: {
    where: { revokedAt: null, confirmedAt: { not: null } },
    select: {
      confirmedAt: true,
      revokedAt: true,
      player: { select: { id: true, birthDate: true } },
    },
  },
  coachAthleteLinks: {
    where: { status: 'ACTIVE' as const },
    select: {
      playerId: true,
      player: {
        select: { playerCts: { where: { status: 'ACTIVE' as const }, select: { ctId: true, status: true } } },
      },
    },
  },
  createdPlayers: {
    select: {
      id: true,
      playerCts: { where: { status: 'ACTIVE' as const }, select: { ctId: true, status: true } },
    },
  },
} as const;

