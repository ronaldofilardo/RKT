import { prisma } from '@/lib/prisma';
import { ConflictError, NotFoundError } from '@/lib/errors';
import type { CreateMatchInput, MatchEventScope } from '@/schemas/contracts';
import { buildCreateMatchData } from './match-create-build.logic';
import { buildAnnotationInput } from './match-template-payload.logic';
import { assertTemplateCreatorAllowed } from './match-template-guards.logic';
import { notifyPoolMatchCreated } from './notification-create.logic';
import { resolveMatchCtId, type MatchCtUser } from './match-ct-id.logic';

const ANNOTATION_INCLUDE = { player1: true, player2: true } as const;

export async function createEventTemplate(
  data: CreateMatchInput,
  createdByUserId: string,
  user?: MatchCtUser,
) {
  const scope: MatchEventScope =
    data.eventScope && data.eventScope !== 'PRIVATE_PERSONAL'
      ? data.eventScope
      : data.isPublicTemplate ? 'PUBLIC' : 'PRIVATE_PERSONAL';
  const isPublic = scope === 'PUBLIC';
  if (isPublic) await assertTemplateCreatorAllowed(createdByUserId);
  // Contexto ativo do criador vence o `ctId` vindo do formulário (Fase C).
  const ctId = resolveMatchCtId(user, data.ctId);

  return prisma.$transaction(async (tx) => {
    const match = await tx.match.create({
      data: buildCreateMatchData(
        {
          ...data,
          ctId,
          isTemplate: true,
          isPublicTemplate: isPublic,
          eventScope: scope,
          sourceMatchId: undefined,
          visibility: isPublic ? 'PUBLIC' : 'PLAYERS_ONLY',
        },
        createdByUserId,
      ),
      include: ANNOTATION_INCLUDE,
    });
    await tx.auditLog.create({
      data: {
        actorUserId: createdByUserId, action: 'MATCH_TEMPLATE_CREATED',
        resourceType: 'Match', resourceId: match.id, ctId: match.ctId ?? null,
        meta: { format: match.format, eventScope: scope },
      },
    });
    await notifyPoolMatchCreated(match, createdByUserId, tx, isPublic);
    return match;
  });
}

export async function createPublicTemplate(data: CreateMatchInput, createdByUserId: string) {
  return createEventTemplate({ ...data, isPublicTemplate: true, eventScope: 'PUBLIC' }, createdByUserId);
}

export async function createAnnotationFromTemplate(
  templateId: string,
  actorUserId: string,
  ctId?: string | null,
  user?: MatchCtUser,
) {
  const template = await prisma.match.findFirst({
    where: { id: templateId, deletedAt: null, OR: [{ isPublicTemplate: true }, { isTemplate: true }] },
  });
  if (!template) throw new NotFoundError('MatchTemplate', templateId);

  const existing = await prisma.match.findFirst({
    where: { sourceMatchId: templateId, createdByUserId: actorUserId, deletedAt: null, state: { not: 'CANCELLED' } },
    select: { id: true },
  });
  if (existing) {
    throw new ConflictError('Você já está anotando esta partida', { code: 'ALREADY_ANNOTATING', matchId: existing.id });
  }

  const isOfficial = Boolean(template.assignedCoachId && template.assignedCoachId === actorUserId);
  const payload = buildAnnotationInput({
    ...template,
    eventScope: template.eventScope ?? 'PUBLIC',
    isOfficialClubAnnotation: isOfficial,
  });
  // Helper único: `null` (PARTICULAR/sem CT) força `ctId` nulo na derivada em vez
  // de herdar `template.ctId` — é o bug que fazia a anotação sumir do criador.
  const resolvedCtId = resolveMatchCtId(user, ctId);
  const data = buildCreateMatchData(payload, actorUserId);
  const derived = await prisma.match.create({
    data: { ...data, sourceMatchId: templateId, isOfficialClubAnnotation: isOfficial, ctId: resolvedCtId },
    include: ANNOTATION_INCLUDE,
  });
  await prisma.auditLog.create({
    data: {
      actorUserId, action: 'MATCH_ANNOTATION_CREATED',
      resourceType: 'Match', resourceId: derived.id, ctId: resolvedCtId, meta: { sourceMatchId: templateId },
    },
  });
  return derived;
}
