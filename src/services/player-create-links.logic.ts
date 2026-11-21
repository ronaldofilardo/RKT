import { prisma } from '@/lib/prisma';
import { randomBytes, createHash } from 'crypto';
import { isMinor } from '@/core/access/age';
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
  guardianName?: string | null;
  guardianCpf?: string | null;
  guardianPhone?: string | null;
  guardianContact?: string | null;
}

export async function handlePlayerPostCreate(input: HandlePlayerPostCreateInput) {
  const { player, myClub, ctId, createdByUserId, actorProfile } = input;

  if (actorProfile === 'GESTOR' || actorProfile === 'TREINADOR') {
    try {
      await ensureAthleteUserAccount({
        playerId: player.id, name: player.name, birthDate: player.birthDate,
        cpf: player.cpf, email: player.email, athleteCode: player.athleteCode, ctId,
      });
    } catch {}
  }

  if (ctId && isMinor(player.birthDate, new Date()) && (input.guardianName || input.guardianCpf)) {
    try {
      const gCpf = input.guardianCpf ? input.guardianCpf.replace(/\D/g, '') : null;
      const gCpfHash = gCpf ? createHash('sha256').update(gCpf).digest('hex') : null;
      const noticeToken = randomBytes(24).toString('base64url');
      const tokenHash = createHash('sha256').update(noticeToken).digest('hex');
      const codeHash = createHash('sha256').update(Math.floor(100000 + Math.random() * 900000).toString()).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await prisma.guardianInvite.create({
        data: {
          playerId: player.id, ctId, createdByUserId: createdByUserId || player.id,
          createdByKind: actorProfile === 'GESTOR' ? 'GESTOR' : 'MENOR',
          preGuardianName: input.guardianName ?? null, preGuardianCpf: gCpf, preGuardianCpfHash: gCpfHash,
          preGuardianPhone: input.guardianPhone ?? null, preGuardianContact: input.guardianContact ?? null,
          tokenHash, codeHash, expiresAt,
        },
      });
    } catch {}
  }

  if (myClub && actorProfile) {
    if (ctId) {
      const status = actorProfile === 'ATLETA' ? 'PENDING' : 'ACTIVE';
      await prisma.playerCT.upsert({
        where: { playerId_ctId: { playerId: player.id, ctId } },
        create: { playerId: player.id, ctId, status },
        update: {},
      });
    }
    if (actorProfile === 'TREINADOR' && createdByUserId) {
      await prisma.coachAthleteLink.upsert({
        where: { coachUserId_playerId: { coachUserId: createdByUserId, playerId: player.id } },
        create: { coachUserId: createdByUserId, playerId: player.id, status: 'ACTIVE' },
        update: {},
      });
    }
  }
}
