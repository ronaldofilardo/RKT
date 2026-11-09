import type { Prisma } from '@prisma/client';

/**
 * Seleção de `User` usada por `GET /api/auth/me`.
 * `satisfies` preserva o tipo literal do select, mantendo o resultado do Prisma
 * com a mesma forma (e inferência) do select escrito inline na rota.
 */
export const ME_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  cpf: true,
  mustChangePassword: true,
  canOperate: true,
  memberships: {
    where: { status: 'ACTIVE' },
    select: { kind: true, preset: true, ctId: true, status: true },
  },
  coachAthleteLinks: {
    where: { status: 'ACTIVE' },
    select: {
      playerId: true,
      player: {
        select: {
          playerCts: { where: { status: 'ACTIVE' }, select: { ctId: true, status: true } },
        },
      },
    },
  },
  createdPlayers: {
    select: {
      id: true,
      playerCts: { where: { status: 'ACTIVE' }, select: { ctId: true, status: true } },
    },
  },
  athleteProfile: {
    select: {
      id: true,
      birthDate: true,
      playerCts: { where: { status: 'ACTIVE' }, select: { ctId: true } },
    },
  },
} satisfies Prisma.UserSelect;
