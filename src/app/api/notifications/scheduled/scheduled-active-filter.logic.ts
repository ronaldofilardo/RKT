import { prisma } from '@/lib/prisma';
import type { Notification } from '@prisma/client';

export async function filterActiveExistingScheduledNotifs(
  notifications: Notification[],
  userId: string,
): Promise<Notification[]> {
  if (notifications.length === 0 || !prisma?.match?.findMany) return notifications;

  const targetIds = Array.from(
    new Set(
      notifications
        .map((n) => {
          const p = (n.payload ?? {}) as { matchId?: string; templateId?: string };
          return p.templateId || p.matchId;
        })
        .filter(Boolean) as string[],
    ),
  );

  if (targetIds.length === 0) return notifications;

  const [matches, derivedFinished] = await Promise.all([
    prisma.match.findMany({
      where: { id: { in: targetIds }, deletedAt: null },
      select: { id: true, state: true },
    }),
    prisma.match.findMany({
      where: {
        sourceMatchId: { in: targetIds },
        createdByUserId: userId,
        deletedAt: null,
        state: { in: ['FINISHED', 'CANCELLED'] },
      },
      select: { sourceMatchId: true },
    }),
  ]);

  const activeMatchIds = new Set(
    (matches ?? [])
      .filter((m) => m.state === 'SCHEDULED' || m.state === 'IN_PROGRESS')
      .map((m) => m.id),
  );

  const userFinishedSourceIds = new Set(
    (derivedFinished ?? []).map((d) => d.sourceMatchId).filter(Boolean) as string[],
  );

  const active: Notification[] = [];
  const finishedIds: string[] = [];

  for (const notif of notifications) {
    const p = (notif.payload ?? {}) as { matchId?: string; templateId?: string };
    const targetId = p.templateId || p.matchId;
    if (!targetId || (activeMatchIds.has(targetId) && !userFinishedSourceIds.has(targetId))) {
      active.push(notif);
    } else {
      finishedIds.push(notif.id);
    }
  }

  if (finishedIds.length > 0 && prisma?.notification?.updateMany) {
    prisma.notification
      .updateMany({
        where: { id: { in: finishedIds } },
        data: { readAt: new Date() },
      })
      .catch(() => {});
  }

  return active;
}

export async function findUserFinishedDerivedMatchIds(
  candidateMatchIds: string[],
  userId: string,
): Promise<Set<string>> {
  if (candidateMatchIds.length === 0 || !prisma?.match?.findMany) return new Set();

  const finished =
    (await prisma.match.findMany({
      where: {
        sourceMatchId: { in: candidateMatchIds },
        createdByUserId: userId,
        deletedAt: null,
        state: { in: ['FINISHED', 'CANCELLED'] },
      },
      select: { sourceMatchId: true },
    })) ?? [];

  return new Set(finished.map((d) => d.sourceMatchId).filter(Boolean) as string[]);
}
