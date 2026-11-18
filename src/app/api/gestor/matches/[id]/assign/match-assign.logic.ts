import { notifyCoachAssigned } from '@/services/notification-create.logic';

interface AssignCoachesTxParams {
  match: any;
  targetId: string;
  primaryCoachId: string;
  targetCoachIds: string[];
  actorUserId: string;
  actorName: string;
  ctId: string;
}

export async function executeMatchCoachAssignmentTx(
  tx: any,
  {
    match,
    targetId,
    primaryCoachId,
    targetCoachIds,
    actorUserId,
    actorName,
    ctId,
  }: AssignCoachesTxParams,
) {
  const res = await tx.match.update({
    where: { id: targetId },
    data: { assignedCoachId: primaryCoachId },
  });

  if (tx.matchAssignedCoach) {
    await tx.matchAssignedCoach.deleteMany({
      where: { matchId: targetId, coachId: { notIn: targetCoachIds } },
    });
    for (const coachId of targetCoachIds) {
      await tx.matchAssignedCoach.upsert({
        where: {
          MatchAssignedCoach_matchId_coachId_key: { matchId: targetId, coachId },
        },
        update: {},
        create: { matchId: targetId, coachId, assignedBy: actorUserId },
      });
    }
  }

  if (typeof tx.match.updateMany === 'function') {
    await tx.match.updateMany({
      where: { sourceMatchId: targetId, createdByUserId: { notIn: targetCoachIds }, deletedAt: null },
      data: { isOfficialClubAnnotation: false },
    });
    await tx.match.updateMany({
      where: { sourceMatchId: targetId, createdByUserId: { in: targetCoachIds }, deletedAt: null },
      data: { isOfficialClubAnnotation: true },
    });
  }

  await tx.auditLog.create({
    data: {
      actorUserId,
      action: 'MATCH_COACH_ASSIGNED',
      resourceType: 'Match',
      resourceId: targetId,
      ctId,
      meta: { coachUserId: primaryCoachId, coachUserIds: targetCoachIds },
    },
  });

  for (const coachId of targetCoachIds) {
    await notifyCoachAssigned({ ...match, id: targetId }, coachId, actorName, tx);
  }

  return res;
}
