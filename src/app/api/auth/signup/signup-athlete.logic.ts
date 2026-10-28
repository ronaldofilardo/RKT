import { prisma } from '@/lib/prisma';
import { handleSignupPlayerClaim } from './signup-claim.logic';

/** Garante que exista um Player CONFIRMED vinculado à conta do atleta.
 *
 * Regras:
 * - ATLETA/ATLETA_AVULSO: cria Player sem PlayerCT.
 * - ATLETA_CLUBE: cria Player e vincula PlayerCT a um CT ativo (se houver).
 * - Se CPF+birthDate baterem em Player PROVISIONAL existente, faz claim automático (maior)
 *   ou bloqueia (menor).
 */
export async function ensureAthletePlayer({
  userId,
  name,
  email,
  role,
  cpfRaw,
  birthDateRaw,
}: {
  userId: string;
  name: string;
  email: string | null;
  role: 'ATLETA' | 'ATLETA_AVULSO' | 'ATLETA_CLUBE';
  cpfRaw?: string | null;
  birthDateRaw?: string | null;
}): Promise<{ playerId: string; claimed?: boolean; claimBlocked?: boolean }> {
  const birthDate = birthDateRaw ? new Date(birthDateRaw) : null;
  if (birthDate && Number.isNaN(birthDate.getTime())) {
    throw new Error('INVALID_BIRTH_DATE');
  }

  // Claim automático quando CPF+birthDate batem Player PROVISIONAL existente.
  if (cpfRaw && birthDate) {
    const claim = await handleSignupPlayerClaim({
      userId,
      name,
      email,
      cpfRaw,
      birthDate,
    });
    if (claim.kind === 'claimed') {
      return { playerId: claim.playerId, claimed: true };
    }
    if (claim.kind === 'blocked-minor') {
      return { playerId: claim.playerId, claimBlocked: true };
    }
    // kind === 'created': Player já criado pelo claim e vinculado à conta.
    return { playerId: claim.playerId };
  } else {
    // Sem CPF/birthDate: garante Player CONFIRMED vinculado à conta.
    const existingPlayer = await prisma.player.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (existingPlayer) {
      if (role === 'ATLETA_CLUBE') {
        await linkPlayerToActiveCt(existingPlayer.id);
      }
      return { playerId: existingPlayer.id };
    }
  }

  // Cria Player CONFIRMED vinculado à conta (apenas quando claim não criou).
  const player = await prisma.player.create({
    data: {
      name,
      email,
      userId,
      createdByUserId: userId,
      identityStatus: 'CONFIRMED',
    },
    select: { id: true },
  });

  // ATLETA_CLUBE vincula PlayerCT a um CT ativo.
  if (role === 'ATLETA_CLUBE') {
    const ct = await prisma.trainingCenter.findFirst({ where: { status: 'ACTIVE' } });
    if (ct) {
      await prisma.playerCT.upsert({
        where: { playerId_ctId: { playerId: player.id, ctId: ct.id } },
        create: { playerId: player.id, ctId: ct.id, status: 'ACTIVE' },
        update: { status: 'ACTIVE' },
      });
    }
  }

  return { playerId: player.id };
}

async function linkPlayerToActiveCt(playerId: string): Promise<void> {
  const ct = await prisma.trainingCenter.findFirst({ where: { status: 'ACTIVE' } });
  if (ct) {
    await prisma.playerCT.upsert({
      where: { playerId_ctId: { playerId, ctId: ct.id } },
      create: { playerId, ctId: ct.id, status: 'ACTIVE' },
      update: { status: 'ACTIVE' },
    });
  }
}
