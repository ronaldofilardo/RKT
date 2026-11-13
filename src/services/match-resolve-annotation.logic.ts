import { prisma } from '@/lib/prisma';
import { ConflictError, ForbiddenError, NotFoundError, getPrismaErrorCode } from '@/lib/errors';
import type { Actor } from '@/core/access/types';
import {
  buildDerivedAnnotationData,
  canResolveTargetMatch,
  type TemplateRecord,
} from './match-resolve-payload.logic';

const ANNOTATION_INCLUDE = { player1: true, player2: true } as const;

async function findActiveDerived(templateId: string, userId: string) {
  return prisma.match.findFirst({
    where: {
      sourceMatchId: templateId,
      createdByUserId: userId,
      deletedAt: null,
      state: { not: 'CANCELLED' },
    },
    select: { id: true, state: true },
  });
}

function alreadyAnnotatingResponse(matchId: string, state: string, mode: 'resolve' | 'create') {
  if (mode === 'create') {
    throw new ConflictError('Você já está anotando esta partida', {
      code: 'ALREADY_ANNOTATING',
      matchId,
    });
  }
  return { matchId, created: false, state, match: undefined as unknown };
}

/**
 * Resolve ou cria a anotação soberana do ator para um cartaz (template `[12421]`)
 * ou partida raiz legada em que o treinador foi explicitamente designado.
 */
export async function resolveOrCreateAnnotation(
  templateId: string,
  actor: Actor,
  mode: 'resolve' | 'create' = 'resolve',
  ctId?: string | null,
) {
  const template = (await prisma.match.findFirst({
    where: { id: templateId, deletedAt: null },
  })) as TemplateRecord | null;

  if (!template) throw new NotFoundError('MatchTemplate', templateId);
  if (!canResolveTargetMatch(template, actor)) {
    throw new ForbiddenError('MATCH_TEMPLATE_ACCESS');
  }

  const isLegacyOwnedMatch =
    !template.isTemplate && !template.isPublicTemplate && template.createdByUserId === actor.userId;
  if (isLegacyOwnedMatch) {
    return alreadyAnnotatingResponse(template.id, template.state, mode);
  }

  const existing = await findActiveDerived(templateId, actor.userId);
  if (existing) return alreadyAnnotatingResponse(existing.id, existing.state, mode);

  const { data, resolvedCtId } = buildDerivedAnnotationData(template, actor, ctId);

  try {
    const derived = await prisma.match.create({ data, include: ANNOTATION_INCLUDE });

    await prisma.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: 'MATCH_ANNOTATION_CREATED',
        resourceType: 'Match',
        resourceId: derived.id,
        ctId: resolvedCtId,
        meta: { sourceMatchId: templateId, eventScope: template.eventScope },
      },
    });

    return { matchId: derived.id, created: true, state: derived.state, match: derived };
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2002') {
      const raced = await findActiveDerived(templateId, actor.userId);
      if (raced) return alreadyAnnotatingResponse(raced.id, raced.state, mode);
    }
    throw error;
  }
}
