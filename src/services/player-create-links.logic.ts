import { prisma } from '@/lib/prisma';
import { ensureAthleteUserAccount } from './athlete-provision.logic';

export interface HandlePlayerPostCreateInput {
  player: {
    id: string;
    name: string;
    birthDate: Date | null;
    cpf?: string | null;
    cpfHash?: string | null;
    userId?: string | null;
    athleteCode?: string | null;
    email?: string | null;
  };
  myClub?: boolean | null;
  ctId?: string | null;
  createdByUserId?: string | null;
  actorProfile?: 'ATLETA' | 'GESTOR' | 'TREINADOR' | null;
}

export async function handlePlayerPostCreate(input: HandlePlayerPostCreateInput) {
  const { player, myClub, ctId, createdByUserId, actorProfile } = input;

  if (actorProfile === 'GESTOR' || actorProfile === 'TREINADOR') {
    try {
      await ensureAthleteUserAccount({
        playerId: player.id,
        name: player.name,
        birthDate: player.birthDate,
        cpf: player.cpf,
        email: player.email,
        athleteCode: player.athleteCode,
        ctId,
      });
    } catch {
      // Falha não-bloqueante no provisionamento inicial
    }
  }

  if (myClub && actorProfile) {
    if (ctId) {
      const status = actorProfile === 'ATLETA' ? 'PENDING' : 'ACTIVE';
      await prisma.playerCT.create({
        data: { playerId: player.id, ctId, status },
      });
    } else if (actorProfile === 'TREINADOR' && createdByUserId) {
      await prisma.coachAthleteLink.create({
        data: { coachUserId: createdByUserId, playerId: player.id, status: 'ACTIVE' },
      });
    }
  }
}
