import { prisma } from '@/lib/prisma';
import { ConflictError, NotFoundError } from '@/lib/errors';
import type { CreateMatchInput } from '@/schemas/contracts';
import { buildCreateMatchData } from './match-create-build.logic';
import { buildAnnotationInput } from './match-template-payload.logic';
import { assertTemplateCreatorAllowed } from './match-template-guards.logic';

const ANNOTATION_INCLUDE = { player1: true, player2: true } as const;

/**
 * Cria o cartaz público no pool: um Match sem PointLog próprio, marcado como
 * `isPublicTemplate`. Cada anotação derivada terá seu próprio PointLog.
 */
export async function createPublicTemplate(
  data: CreateMatchInput,
  createdByUserId: string,
) {
  await assertTemplateCreatorAllowed(createdByUserId);

  const match = await prisma.match.create({
    data: buildCreateMatchData(
      { ...data, isPublicTemplate: true, sourceMatchId: undefined, visibility: 'PUBLIC' },
      createdByUserId,
    ),
    include: ANNOTATION_INCLUDE,
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: createdByUserId,
      action: 'MATCH_TEMPLATE_CREATED',
      resourceType: 'Match',
      resourceId: match.id,
      ctId: match.ctId ?? null,
      meta: { format: match.format },
    },
  });

  return match;
}

/**
 * Gera a anotação soberana do ator a partir de um template do pool.
 * Um ator só pode ter uma anotação ativa por template (409 caso contrário).
 */
export async function createAnnotationFromTemplate(
  templateId: string,
  actorUserId: string,
  ctId?: string | null,
) {
  const template = await prisma.match.findFirst({
    where: { id: templateId, isPublicTemplate: true, deletedAt: null },
  });
  if (!template) throw new NotFoundError('MatchTemplate', templateId);

  const existing = await prisma.match.findFirst({
    where: {
      sourceMatchId: templateId,
      createdByUserId: actorUserId,
      deletedAt: null,
      state: { not: 'CANCELLED' },
    },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError('Você já está anotando esta partida', {
      code: 'ALREADY_ANNOTATING',
      matchId: existing.id,
    });
  }

  const payload = buildAnnotationInput(template);
  const data = buildCreateMatchData(payload, actorUserId);

  const derived = await prisma.match.create({
    data: {
      ...data,
      sourceMatchId: templateId,
      ...(ctId ? { ctId } : {}),
    },
    include: ANNOTATION_INCLUDE,
  });

  await prisma.auditLog.create({
    data: {
      actorUserId,
      action: 'MATCH_ANNOTATION_CREATED',
      resourceType: 'Match',
      resourceId: derived.id,
      ctId: ctId ?? null,
      meta: { sourceMatchId: templateId },
    },
  });

  return derived;
}
