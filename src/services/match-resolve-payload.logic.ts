import { prisma } from '@/lib/prisma';
import type { Actor } from '@/core/access/types';
import {
  canDiscoverMatchTemplate,
  type MatchTemplateAccess,
} from '@/core/access/match-event-visibility';
import { buildCreateMatchData } from './match-create-build.logic';
import { buildAnnotationInput, type TemplateLike } from './match-template-payload.logic';

export interface TemplateRecord extends TemplateLike {
  id: string;
  state: string;
  sourceMatchId: string | null;
  isTemplate: boolean;
  isPublicTemplate: boolean;
  createdByUserId: string | null;
  assignedCoachId: string | null;
  ctId: string | null;
}

export async function canResolveTargetMatch(target: TemplateRecord, actor: Actor): Promise<boolean> {
  if (actor.memberships.some((m) => m.kind === 'PLATAFORMA' && m.preset === 'ADMIN' && m.status === 'ACTIVE')) return true;
  if (target.createdByUserId === actor.userId || target.assignedCoachId === actor.userId) return true;
  const staffCts = actor.memberships.filter((m) => m.status === 'ACTIVE' && (m.kind === 'GESTOR' || m.kind === 'TREINADOR') && m.ctId).map((m) => m.ctId as string);
  if (target.ctId && staffCts.includes(target.ctId)) return true;
  if (canDiscoverMatchTemplate(actor, toTemplateAccess(target))) return true;
  if (staffCts.length > 0 && prisma?.playerCT?.findFirst) {
    const pIds = [target.player1Id, target.player2Id, target.player1PartnerId, target.player2PartnerId].filter((v): v is string => !!v);
    const aff = await prisma.playerCT.findFirst({ where: { playerId: { in: pIds }, ctId: { in: staffCts }, status: 'ACTIVE' }, select: { id: true } });
    if (aff) return true;
  }
  return false;
}

export function toTemplateAccess(template: TemplateRecord): MatchTemplateAccess {
  const participantPlayerIds = [
    template.player1Id,
    template.player2Id,
    template.player1PartnerId,
    template.player2PartnerId,
  ].filter((v): v is string => !!v);

  return {
    eventScope: template.eventScope,
    createdByUserId: template.createdByUserId,
    ctId: template.ctId,
    participantPlayerIds,
  };
}

export function resolveDerivedCtId(
  template: TemplateRecord,
  actor: Actor,
  explicitCtId?: string | null,
): string | null {
  // `null` = contexto PARTICULAR/sem CT explícito → nunca herda o CT do cartaz.
  // `undefined` = token sem contexto → infere `template.ctId` só para membro ativo.
  if (explicitCtId !== undefined) return explicitCtId;
  if (!template.ctId) return null;
  const inCt =
    actor.memberships.some((m) => m.status === 'ACTIVE' && m.ctId === template.ctId) ||
    actor.athleteCtIds.includes(template.ctId);
  return inCt ? template.ctId : null;
}

export function buildDerivedAnnotationData(
  template: TemplateRecord,
  actor: Actor,
  ctId?: string | null,
) {
  const isOfficial = Boolean(template.assignedCoachId && template.assignedCoachId === actor.userId);
  const payload = buildAnnotationInput({
    ...template,
    isOfficialClubAnnotation: isOfficial,
  });
  const data = buildCreateMatchData(payload, actor.userId);
  const resolvedCtId = resolveDerivedCtId(template, actor, ctId);
  return {
    resolvedCtId,
    data: {
      ...data,
      sourceMatchId: template.id,
      isOfficialClubAnnotation: isOfficial,
      // `null` é gravado como nulo (coluna sem default): sem herança silenciosa de CT.
      ctId: resolvedCtId,
    },
  };
}

