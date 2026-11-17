import type { Actor } from '@/core/access/types';
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
  assignedCoaches?: Array<{ coachId: string }> | null;
  ctId: string | null;
}

export { canResolveTargetMatch, toTemplateAccess } from './match-resolve-access.logic';

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
  const isOfficial = Boolean(
    (template.assignedCoachId && template.assignedCoachId === actor.userId) ||
    (Array.isArray(template.assignedCoaches) && template.assignedCoaches.some((ac) => ac.coachId === actor.userId))
  );
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
