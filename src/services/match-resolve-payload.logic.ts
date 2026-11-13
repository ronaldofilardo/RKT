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

export function canResolveTargetMatch(target: TemplateRecord, actor: Actor): boolean {
  if (target.isTemplate || target.isPublicTemplate) {
    return (
      canDiscoverMatchTemplate(actor, toTemplateAccess(target)) ||
      target.assignedCoachId === actor.userId
    );
  }
  if (target.createdByUserId === actor.userId) return true;
  return target.sourceMatchId === null && target.assignedCoachId === actor.userId;
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

