import { prisma } from '@/lib/prisma';
import type { MembershipKind } from '@prisma/client';

export async function syncUserRoleMemberships(userId: string, targetRole: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { memberships: true, athleteProfile: true },
  });
  if (!user) return;

  if (prisma.membership?.deleteMany) {
    const kindsToRemove: MembershipKind[] = targetRole === 'SUPORTE'
      ? ['GESTOR', 'TREINADOR']
      : targetRole === 'GESTOR'
        ? ['PLATAFORMA', 'TREINADOR']
        : targetRole === 'TREINADOR'
          ? ['PLATAFORMA', 'GESTOR']
          : ['PLATAFORMA', 'GESTOR', 'TREINADOR'];
    await prisma.membership.deleteMany({
      where: { userId, kind: { in: kindsToRemove } },
    });
  }

  if (targetRole === 'SUPORTE') {
    const existing = user.memberships?.find(
      (m) => m.kind === 'PLATAFORMA' && m.preset === 'SUPORTE'
    );
    if (!existing && prisma.membership?.create) {
      await prisma.membership.create({
        data: { userId, kind: 'PLATAFORMA', preset: 'SUPORTE', status: 'ACTIVE' },
      });
    }
  } else if (targetRole === 'GESTOR') {
    const existing = user.memberships?.find((m) => m.kind === 'GESTOR');
    if (!existing && prisma.membership?.create) {
      const ct = await prisma.trainingCenter?.findFirst?.({ where: { status: 'ACTIVE' } });
      await prisma.membership.create({
        data: { userId, kind: 'GESTOR', status: 'ACTIVE', ctId: ct?.id || null },
      });
    }
  } else if (targetRole === 'TREINADOR') {
    const existing = user.memberships?.find((m) => m.kind === 'TREINADOR');
    if (!existing && prisma.membership?.create) {
      const ct = await prisma.trainingCenter?.findFirst?.({ where: { status: 'ACTIVE' } });
      await prisma.membership.create({
        data: { userId, kind: 'TREINADOR', status: 'ACTIVE', ctId: ct?.id || null },
      });
    }
  } else if (targetRole === 'ATLETA_CLUBE' || targetRole === 'ATLETA_AVULSO') {
    let playerId = user.athleteProfile?.id;
    if (!playerId && prisma.player?.create) {
      const player = await prisma.player.create({
        data: { name: user.name, email: user.email, userId, createdByUserId: userId },
      });
      playerId = player.id;
    }
    if (targetRole === 'ATLETA_CLUBE' && playerId && prisma.trainingCenter?.findFirst && prisma.playerCT?.upsert) {
      const ct = await prisma.trainingCenter.findFirst({ where: { status: 'ACTIVE' } });
      if (ct) {
        await prisma.playerCT.upsert({
          where: { playerId_ctId: { playerId, ctId: ct.id } },
          create: { playerId, ctId: ct.id, status: 'ACTIVE' },
          update: { status: 'ACTIVE' },
        });
      }
    } else if (targetRole === 'ATLETA_AVULSO' && playerId && prisma.playerCT?.deleteMany) {
      await prisma.playerCT.deleteMany({ where: { playerId } });
    }
  }
}
