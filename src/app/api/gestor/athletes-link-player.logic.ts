import { prisma } from '@/lib/prisma';

/**
 * Cria/reaproveita o Player da conta, reativa o vínculo com o CT (ACTIVE) e
 * cria os vínculos dos treinadores ativos. Devolve o `Player.id` vinculado.
 */
export async function resolveLinkedPlayerId(input: {
  ctId: string;
  issuedByUserId: string;
  existingUser: { id: string; name: string; email?: string | null; cpf?: string | null };
  /** Player já existente a ser vinculado (ex.: atleta do clube sem conta de acesso). */
  playerId?: string;
  /** Dados do formulário, usados só quando for preciso criar o Player da conta. */
  athlete?: { birthDate: string; gender: string; laterality: string };
}): Promise<string> {
  const { ctId, issuedByUserId, existingUser, playerId, athlete } = input;

  return prisma.$transaction(async (tx) => {
    let pid = playerId ?? null;

    if (!pid) {
      const ownPlayer = await tx.player.findFirst({ where: { userId: existingUser.id }, select: { id: true } });
      if (ownPlayer) {
        pid = ownPlayer.id;
      } else {
        const created = await tx.player.create({
          data: {
            name: existingUser.name,
            email: existingUser.email ?? null,
            cpf: existingUser.cpf ?? null,
            birthDate: athlete ? new Date(athlete.birthDate) : null,
            gender: athlete?.gender,
            dominance: athlete?.laterality,
            userId: existingUser.id,
            createdByUserId: issuedByUserId,
            identityStatus: 'CONFIRMED',
          },
          select: { id: true },
        });
        pid = created.id;
      }
    } else {
      await tx.player.update({
        where: { id: pid },
        data: { userId: existingUser.id, identityStatus: 'CONFIRMED' },
      });
    }

    // O atleta cadastrado pelo clube pertence ao clube: vínculo nasce/re-nasce ACTIVE.
    const pct = await tx.playerCT.findFirst({ where: { playerId: pid, ctId }, select: { id: true } });
    if (pct) {
      await tx.playerCT.update({ where: { id: pct.id }, data: { status: 'ACTIVE', endedAt: null } });
    } else {
      await tx.playerCT.create({ data: { playerId: pid, ctId, status: 'ACTIVE' } });
    }

    const coaches = await tx.membership.findMany({
      where: { ctId, kind: 'TREINADOR', status: 'ACTIVE' },
      select: { userId: true },
    });
    await tx.coachAthleteLink.createMany({
      data: coaches.map((c) => ({ coachUserId: c.userId, playerId: pid, status: 'ACTIVE' })),
      skipDuplicates: true,
    });

    return pid;
  });
}
