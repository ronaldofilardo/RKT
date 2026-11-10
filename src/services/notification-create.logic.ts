import type { Prisma } from '@prisma/client';
import type { PoolMatchPayload, AssignedToAnnotatePayload } from '@/schemas/notification';

export interface TemplateNotificationInput {
  id: string;
  player1Id: string;
  player2Id: string;
  player1?: { name: string } | null;
  player2?: { name: string } | null;
  tournamentName?: string | null;
  scheduledAt?: Date | null;
  ctId?: string | null;
}

export async function notifyPoolMatchCreated(
  template: TemplateNotificationInput,
  creatorId: string,
  tx: Prisma.TransactionClient,
) {
  const athleteIds = [template.player1Id, template.player2Id];
  const [links, guardians, players] = await Promise.all([
    tx.coachAthleteLink.findMany({ where: { playerId: { in: athleteIds }, status: 'ACTIVE' }, select: { coachUserId: true } }),
    tx.guardianLink.findMany({ where: { playerId: { in: athleteIds }, revokedAt: null }, select: { guardianUserId: true } }),
    tx.player.findMany({ where: { id: { in: athleteIds }, userId: { not: null } }, select: { userId: true } }),
  ]);

  const myAthletesUserIds = new Set<string>([
    ...links.map((l) => l.coachUserId),
    ...guardians.map((g) => g.guardianUserId),
    ...players.map((p) => p.userId!).filter(Boolean),
  ]);
  myAthletesUserIds.delete(creatorId);

  const potentialOthers = template.ctId
    ? (await tx.membership.findMany({ where: { ctId: template.ctId, status: 'ACTIVE' }, select: { userId: true } })).map((m) => m.userId)
    : (await tx.user.findMany({ where: { isActive: true }, select: { id: true } })).map((u) => u.id);

  const otherUserIds = potentialOthers.filter((id) => id !== creatorId && !myAthletesUserIds.has(id));

  const payload: PoolMatchPayload = {
    matchId: template.id,
    templateId: template.id,
    player1Name: template.player1?.name ?? 'Jogador 1',
    player2Name: template.player2?.name ?? 'Jogador 2',
    ...(template.tournamentName ? { tournamentName: template.tournamentName } : {}),
    ...(template.scheduledAt ? { scheduledAt: template.scheduledAt.toISOString() } : {}),
  };

  const notifs: Prisma.NotificationCreateManyInput[] = [
    ...Array.from(myAthletesUserIds).map((recipientId) => ({
      recipientId, type: 'POOL_MATCH_WITH_MY_ATHLETE' as const, payload: payload as any,
    })),
    ...Array.from(new Set(otherUserIds)).map((recipientId) => ({
      recipientId, type: 'POOL_MATCH_AVAILABLE' as const, payload: payload as any,
    })),
  ];

  if (notifs.length > 0) {
    await tx.notification.createMany({ data: notifs });
  }
}

export async function notifyCoachAssigned(
  template: { id: string; player1?: { name: string } | null; player2?: { name: string } | null; scheduledAt?: Date | null },
  coachUserId: string,
  assignedByName: string,
  tx: Prisma.TransactionClient,
) {
  const payload: AssignedToAnnotatePayload = {
    matchId: template.id,
    templateId: template.id,
    player1Name: template.player1?.name ?? 'Jogador 1',
    player2Name: template.player2?.name ?? 'Jogador 2',
    assignedByName,
    ...(template.scheduledAt ? { scheduledAt: template.scheduledAt.toISOString() } : {}),
  };

  return tx.notification.create({
    data: {
      recipientId: coachUserId,
      type: 'ASSIGNED_TO_ANNOTATE',
      payload: payload as any,
    },
  });
}

