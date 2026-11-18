import { prisma } from '@/lib/prisma';
import type { CreateMatchInput, MatchEventScope } from '@/schemas/contracts';
import { buildCreateMatchData } from './match-create-build.logic';
import { assertTemplateCreatorAllowed } from './match-template-guards.logic';
import { notifyPoolMatchCreated } from './notification-create.logic';
import { resolveMatchCtId, type MatchCtUser } from './match-ct-id.logic';

export { createAnnotationFromTemplate } from './match-annotation-create.logic';

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
