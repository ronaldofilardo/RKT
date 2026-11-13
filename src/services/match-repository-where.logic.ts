import type { MatchState } from '@/schemas/contracts';
import { buildCircleTemplateCondition } from './match-repository-circle.logic';

export interface MatchListScope {
  /** ADMIN/SUPORTE: sem restrição de criador ou CT. */
  unrestricted?: boolean;
  /** Gestor: usuários-membros ativos do CT (para ver derivadas anotadas por eles). */
  ctMemberUserIds?: readonly string[];
}

export interface BuildMatchWhereParams {
  state?: string | null;
  createdByUserId: string;
  contextId?: string | null;
  scope?: MatchListScope | null;
  assignedCoachId?: string | null;
  athletePlayerId?: string | null;
  followedPlayerIds?: readonly string[] | null;
  guardianOfPlayerIds?: readonly string[] | null;
}

export function buildMatchListWhere({
  state,
  createdByUserId,
  contextId,
  scope,
  assignedCoachId,
  athletePlayerId,
  followedPlayerIds,
  guardianOfPlayerIds,
}: BuildMatchWhereParams): Record<string, unknown> {
  const base: Record<string, unknown> = {
    deletedAt: null,
    ...(state ? { state: state as MatchState } : {}),
  };

  if (scope?.unrestricted) {
    return { ...base, isPublicTemplate: false, isTemplate: false };
  }

  const orConditions: Record<string, unknown>[] = [];
  const isGestorScope = Boolean(scope?.ctMemberUserIds && scope.ctMemberUserIds.length > 0);

  if (isGestorScope) {
    if (contextId && contextId !== 'PARTICULAR') {
      orConditions.push({ ctId: contextId });
    } else {
      orConditions.push({ createdByUserId });
    }
    orConditions.push({
      sourceMatchId: { not: null },
      createdByUserId: { in: [...(scope?.ctMemberUserIds ?? [])] },
    });
  } else if (contextId === 'PARTICULAR') {
    orConditions.push({ ctId: null, createdByUserId });
  } else if (contextId) {
    orConditions.push({ ctId: contextId, createdByUserId });
  } else {
    orConditions.push({ createdByUserId });
  }

  const ctxFilter: Record<string, unknown> = !contextId
    ? {}
    : contextId === 'PARTICULAR'
      ? { ctId: null }
      : { ctId: contextId };

  const ownTemplates = { isTemplate: true, createdByUserId, ...ctxFilter };
  const circleTemplates = buildCircleTemplateCondition({
    createdByUserId, athletePlayerId, followedPlayerIds, guardianOfPlayerIds,
  });

  const nonTemplate = orConditions.map((c) => ({
    ...c,
    isPublicTemplate: false,
    isTemplate: false,
  }));

  const templates: Record<string, unknown>[] = [ownTemplates];
  if (circleTemplates) templates.push(circleTemplates);

  if (assignedCoachId) {
    const assignedCond = {
      assignedCoachId,
      annotations: { none: { createdByUserId: assignedCoachId, deletedAt: null, state: { not: 'CANCELLED' } } },
    };
    return { ...base, OR: [...nonTemplate, ...templates, assignedCond] };
  }

  return { ...base, OR: [...nonTemplate, ...templates] };
}

