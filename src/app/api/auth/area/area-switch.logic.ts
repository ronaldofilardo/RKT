import { prisma } from '@/lib/prisma';
import { listAreas, prefixForArea, homeForArea, type AreaCode } from '@/core/access/areas';
import { generateLoginToken } from '../login/login-token-logic';

export interface SwitchAreaResult {
  success: boolean;
  error?: string;
  accessToken?: string;
  area?: AreaCode;
  prefix?: string;
  home?: string;
}

export async function switchUserArea(
  userId: string,
  targetArea: AreaCode,
  targetCtId?: string | null,
): Promise<SwitchAreaResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      sessionVersion: true,
      mustChangePassword: true,
      canOperate: true,
      athleteProfile: { select: { id: true } },
      coachAthleteLinks: { where: { status: 'ACTIVE' }, select: { playerId: true }, take: 1 },
      memberships: {
        where: { status: 'ACTIVE' },
        select: {
          kind: true,
          preset: true,
          ctId: true,
          status: true,
          ct: { select: { id: true, name: true, status: true } },
        },
      },
    },
  });

  if (!user) return { success: false, error: 'USER_NOT_FOUND' };

  const validMemberships = user.memberships
    .filter((m) => !m.ct || m.ct.status !== 'SUSPENDED')
    .map((m) => ({
      kind: m.kind,
      preset: m.preset,
      ctId: m.ctId,
      ctName: m.ct?.name ?? null,
      status: m.status,
    }));

  const areas = listAreas({
    role: user.role,
    canOperate: user.canOperate,
    memberships: validMemberships,
    athlete: user.athleteProfile ? { playerId: user.athleteProfile.id } : null,
    hasParticularCoach: (user.coachAthleteLinks?.length ?? 0) > 0,
  });

  const matching = areas.find((a) => a.code === targetArea && (!targetCtId || a.ctId === targetCtId));
  if (!matching) return { success: false, error: 'AREA_NOT_ALLOWED' };

  // Fase C: o JWT precisa carregar o CT da área — sem isso o token sai sem `ctId`
  // e criação/listagem caem em escopo inconsistente com a área ativa.
  const resolvedCtId = matching.ctId ?? targetCtId ?? undefined;
  if ((targetArea === 'TREINADOR_CLUBE' || targetArea === 'GESTOR') && !resolvedCtId) {
    return { success: false, error: 'CT_REQUIRED' };
  }

  const availableAreaCodes = Array.from(new Set(areas.map((a) => a.code)));
  const accessToken = await generateLoginToken(
    user.id,
    user.role,
    user.sessionVersion,
    user.mustChangePassword,
    undefined,
    undefined,
    resolvedCtId,
    targetArea,
    resolvedCtId,
    availableAreaCodes,
  );

  await prisma.auditLog.create({
    data: { actorUserId: userId, action: 'AREA_SWITCH', resourceType: 'UserSession', resourceId: targetArea },
  }).catch(() => null);

  return {
    success: true,
    accessToken,
    area: targetArea,
    prefix: prefixForArea(targetArea),
    home: homeForArea(targetArea),
  };
}
