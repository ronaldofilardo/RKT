import type { Prisma } from '@prisma/client';
import type { PoolMatchPayload, AssignedToAnnotatePayload } from '@/schemas/notification';
import { resolveAthleteAssociatedUserIds } from './notification-recipients.logic';

export interface TemplateNotificationInput {
  id: string;
  player1Id: string;
  player2Id: string;
  player1PartnerId?: string | null;
  player2PartnerId?: string | null;
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
  isPublic = true,
) {
  const athleteIds = [
    template.player1Id,
    template.player2Id,
    template.player1PartnerId,
    template.player2PartnerId,
  ].filter(Boolean) as string[];
  const [myAthletesUserIds, creator] = await Promise.all([
    resolveAthleteAssociatedUserIds(athleteIds, creatorId, tx),
    tx.user?.findUnique ? tx.user.findUnique({ where: { id: creatorId }, select: { name: true } }) : Promise.resolve(null),
  ]);

  const payload: PoolMatchPayload = {
    matchId: template.id,
    templateId: template.id,
    player1Name: template.player1?.name ?? 'Jogador 1',
    player2Name: template.player2?.name ?? 'Jogador 2',
    createdByName: creator?.name ?? undefined,
    ...(template.tournamentName ? { tournamentName: template.tournamentName } : {}),
    ...(template.scheduledAt ? { scheduledAt: template.scheduledAt.toISOString() } : {}),
  };

  const notifs: Prisma.NotificationCreateManyInput[] = myAthletesUserIds.map((recipientId) => ({
    recipientId,
    type: 'POOL_MATCH_WITH_MY_ATHLETE' as const,
    payload: payload as any,
  }));

  if (isPublic) {
    const potentialOthers = template.ctId
      ? (await tx.membership.findMany({ where: { ctId: template.ctId, status: 'ACTIVE' }, select: { userId: true } })).map((m) => m.userId)
      : (await tx.user.findMany({ where: { isActive: true }, select: { id: true } })).map((u) => u.id);

    const mySet = new Set(myAthletesUserIds);
    const otherUserIds = potentialOthers.filter((id) => id !== creatorId && !mySet.has(id));

    notifs.push(
      ...Array.from(new Set(otherUserIds)).map((recipientId) => ({
        recipientId,
        type: 'POOL_MATCH_AVAILABLE' as const,
        payload: payload as any,
      })),
    );
  }

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
