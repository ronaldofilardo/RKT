import { prisma } from '@/lib/prisma';
import { canDiscoverMatchTemplate } from '@/core/access/match-event-visibility';
import type { Actor } from '@/core/access/types';
import { toTemplateAccess, type TemplateRecord } from './match-resolve-payload.logic';

/** Teto de lote ao ampliar a busca (evita varreduras infinitas do pool). */
const MAX_TAKE = 400;

const TEMPLATE_SELECT = {
  id: true, format: true, matchType: true, sportType: true, courtType: true,
  scheduledAt: true, tournamentName: true, clubName: true, category: true, round: true,
  ctId: true, createdAt: true, createdByUserId: true, assignedCoachId: true,
  eventScope: true, player1Id: true, player2Id: true, player1PartnerId: true, player2PartnerId: true,
  player1: { select: { id: true, name: true, nickname: true } },
  player2: { select: { id: true, name: true, nickname: true } },
  _count: { select: { annotations: true } },
} as const;

export async function listAvailableTemplates(
  actor: Actor,
  options: { scope?: 'all' | 'private' | 'public'; limit?: number } = {},
) {
  if (!actor.isActive) return [];
  const limit = Math.min(options.limit ?? 30, 50);
  const scopeFilter =
    options.scope === 'private'
      ? { in: ['PRIVATE_CLUB', 'PRIVATE_COACH', 'PRIVATE_PLAYERS'] as any }
      : options.scope === 'public'
        ? ('PUBLIC' as any)
        : { in: ['PUBLIC', 'PRIVATE_CLUB', 'PRIVATE_COACH', 'PRIVATE_PLAYERS'] as any };

  const fetchBatch = (take: number) =>
    prisma.match.findMany({
      where: { deletedAt: null, isTemplate: true, eventScope: scopeFilter },
      orderBy: [{ scheduledAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
      take,
      select: TEMPLATE_SELECT,
    });

  const discoverable = (rows: readonly any[]) =>
    rows.filter((r) => canDiscoverMatchTemplate(actor, toTemplateAccess(r as unknown as TemplateRecord)));

  // `canDiscoverMatchTemplate` é aplicado depois da consulta: um `take` fixo
  // poderia cortar cartazes elegíveis e devolver menos que `limit` mesmo com
  // cartazes disponíveis. Amplia o lote enquanto ainda houver o que cortar.
  let take = Math.min(limit * 2, MAX_TAKE);
  let rows = await fetchBatch(take);
  let visible = discoverable(rows);
  while (visible.length < limit && rows.length >= take && take < MAX_TAKE) {
    take = Math.min(take * 2, MAX_TAKE);
    rows = await fetchBatch(take);
    visible = discoverable(rows);
  }
  visible = visible.slice(0, limit);

  if (visible.length === 0) return [];
  const templateIds = visible.map((v) => v.id);
  const myAnnotations = await prisma.match.findMany({
    where: {
      sourceMatchId: { in: templateIds },
      createdByUserId: actor.userId,
      deletedAt: null,
      state: { not: 'CANCELLED' },
    },
    select: { id: true, sourceMatchId: true, state: true },
  });
  const byTemplate = new Map(myAnnotations.map((a) => [a.sourceMatchId!, a]));

  return visible.map(({ _count, ...rest }) => {
    const mine = byTemplate.get(rest.id);
    return {
      ...rest,
      annotationCount: _count.annotations,
      myAnnotationId: mine?.id ?? null,
      myAnnotationState: mine?.state ?? null,
    };
  });
}
