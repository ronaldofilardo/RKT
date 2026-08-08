/**
 * Prisma adapter for `IMatchRepository`.
 *
 * Wraps queries the previous `matchRepository.ts` and `matchService.ts`
 * performed against `prisma.match`. Selects/includes match the existing
 * shapes so service call-sites can keep their expected return types.
 *
 * @see docs/adr/ADR-0004-repository-pattern.md
 */

import { prisma } from '@/lib/prisma';
import type { Match, Prisma } from '@prisma/client';
import type { IMatchRepository, MatchListingOptions, MatchUpsertInput, TransactionClient } from '../ports/match.repository.port';
import type { IUnitOfWork } from '../ports/uow.port';

const LIST_SELECT = {
  id: true,
  state: true,
  format: true,
  sportType: true,
  courtType: true,
  scheduledAt: true,
  startedAt: true,
  finishedAt: true,
  nickname: true,
  visibility: true,
  isResuming: true,
  openForAnnotation: true,
  tournamentName: true,
  category: true,
  round: true,
  bracketType: true,
  temperature: true,
  humidity: true,
  version: true,
  scoreState: true,
  initialServerId: true,
  player1: { select: { id: true, name: true } },
  player2: { select: { id: true, name: true } },
} as const;

const GET_SELECT = { ...LIST_SELECT, createdByUserId: true } as const;

export class PrismaMatchRepository implements IMatchRepository {
  constructor(private readonly unitOfWork?: IUnitOfWork) {}

  private getClient(tx?: TransactionClient): TransactionClient {
    void this.unitOfWork;
    return tx ?? (prisma as unknown as TransactionClient);
  }

  async list(options?: MatchListingOptions): Promise<Partial<Match>[]> {
    const { state = null, cursor = null, limit = 20 } = options ?? {};
    return prisma.match.findMany({
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      where: { ...(state ? { state: state as Match['state'] } : {}) },
      select: LIST_SELECT as unknown as Prisma.MatchFindManyArgs['select'],
      orderBy: { createdAt: 'desc' },
    }) as Promise<Partial<Match>[]>;
  }

  async findById(id: string): Promise<Partial<Match> | null> {
    return prisma.match.findFirst({
      where: { id },
      select: GET_SELECT as unknown as Prisma.MatchFindFirstArgs['select'],
    }) as Promise<Partial<Match> | null>;
  }

  async findAbandonedSessionSnapshot(matchId: string): Promise<unknown | null> {
    return prisma.matchAnnotationSession.findFirst({
      where: { matchId, status: 'ABANDONED', matchStateSnapshot: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: MatchUpsertInput, tx?: TransactionClient): Promise<Match & { player1: unknown; player2: unknown }> {
    const data: Prisma.MatchCreateInput = {
      format: input.format,
      sportType: input.sportType || 'TENNIS',
      courtType: input.courtType || null,
      nickname: input.nickname || null,
      visibility: (input.visibility as Match['visibility']) || ('PUBLIC' as Match['visibility']),
      openForAnnotation: input.openForAnnotation || false,
      tournamentName: input.tournamentName || null,
      category: input.category || null,
      round: input.round || input.roundName || null,
      bracketType: input.bracketType || null,
      temperature: input.temperature || null,
      humidity: input.humidity || null,
      state: 'SCHEDULED',
      player1: { connect: { id: input.player1Id } },
      player2: { connect: { id: input.player2Id } },
      ...(input.initialServerId ? { initialServerId: input.initialServerId } : {}),
      scheduledAt: input.scheduledAt || null,
      ...(input.createdByUserId ? { createdByUserId: input.createdByUserId } : {}),
    };
    const c = this.getClient(tx);
    return (c as unknown as { match: { create: (args: { data: Prisma.MatchCreateInput; include: { player1: true; player2: true } }) => Promise<Match & { player1: unknown; player2: unknown }> } }).match.create({ data, include: { player1: true, player2: true } });
  }

  async findFirstForUpdate(id: string): Promise<(Match & { pointLog: { id: string }[]; annotationSessions: { id: string }[] }) | null> {
    return prisma.match.findFirst({
      where: { id },
      include: { pointLog: { select: { id: true } }, annotationSessions: { select: { id: true } } },
    }) as Promise<(Match & { pointLog: { id: string }[]; annotationSessions: { id: string }[] }) | null>;
  }

  async findFirstWithPlayers(id: string): Promise<(Match & { player1: unknown; player2: unknown }) | null> {
    return prisma.match.findFirst({ where: { id }, include: { player1: true, player2: true } }) as Promise<(Match & { player1: unknown; player2: unknown }) | null>;
  }

  async update(id: string, data: Prisma.MatchUpdateInput, tx?: TransactionClient): Promise<Match & { player1: unknown; player2: unknown }> {
    const c = this.getClient(tx);
    return (c as unknown as { match: { update: (args: { where: { id: string }; data: Prisma.MatchUpdateInput; include: { player1: true; player2: true } }) => Promise<Match & { player1: unknown; player2: unknown }> } }).match.update({ where: { id }, data, include: { player1: true, player2: true } }) as Promise<Match & { player1: unknown; player2: unknown }>;
  }

  async updateWithVersion(id: string, whereVersion: number | undefined, data: Prisma.MatchUpdateInput, tx?: TransactionClient): Promise<Match & { player1: unknown; player2: unknown }> {
    const c = this.getClient(tx);
    const where: Prisma.MatchWhereUniqueInput & { version?: number } = { id };
    if (whereVersion !== undefined) where.version = whereVersion;
    return (c as unknown as { match: { update: (args: { where: Prisma.MatchWhereUniqueInput & { version?: number }; data: Prisma.MatchUpdateInput; include: { player1: true; player2: true } }) => Promise<Match & { player1: unknown; player2: unknown }> } }).match.update({ where, data, include: { player1: true, player2: true } }) as Promise<Match & { player1: unknown; player2: unknown }>;
  }

  async hardDeleteCascade(id: string, tx: TransactionClient): Promise<void> {
    const c = this.getClient(tx) as unknown as {
      pointLog: { deleteMany: (args: { where: { matchId: string } }) => Promise<unknown> };
      matchAnnotationSession: { deleteMany: (args: { where: { matchId: string } }) => Promise<unknown> };
      match: { delete: (args: { where: { id: string } }) => Promise<unknown> };
    };
    await c.pointLog.deleteMany({ where: { matchId: id } });
    await c.matchAnnotationSession.deleteMany({ where: { matchId: id } });
    await c.match.delete({ where: { id } });
  }

  async softDelete(id: string, data: { deletedAt: Date; deletedBy?: string; finishNote?: string }): Promise<void> {
    const c = this.getClient();
    const updateData: Record<string, unknown> = { state: 'CANCELLED', deletedAt: data.deletedAt };
    if (data.deletedBy) updateData.deletedBy = data.deletedBy;
    if (data.finishNote) updateData.finishNote = data.finishNote;
    await (c as unknown as { match: { update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown> } }).match.update({ where: { id }, data: updateData });
  }

  async findMatchForSession(matchId: string): Promise<{ state: string; openForAnnotation: boolean; version: number; scoreState: unknown } | null> {
    return prisma.match.findUnique({
      where: { id: matchId },
      select: { state: true, openForAnnotation: true, version: true, scoreState: true },
    });
  }
}
