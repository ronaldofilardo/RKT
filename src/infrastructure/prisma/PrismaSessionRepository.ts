/**
 * Prisma adapter for `ISessionRepository`.
 *
 * Wraps queries from `sessionService.ts`. Mirrors the existing `select` shapes.
 *
 * @see docs/adr/ADR-0004-repository-pattern.md
 */

import { prisma } from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';
import type { AnnotationSessionStatus } from '@/schemas/contracts';
import type { ISessionRepository, SessionUpdateInput } from '../ports/session.repository.port';

type Tx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export class PrismaSessionRepository implements ISessionRepository {
  async list(matchId: string): Promise<unknown[]> {
    return prisma.matchAnnotationSession.findMany({
      where: { matchId },
      select: {
        id: true,
        annotatorUserId: true,
        isActive: true,
        startedAt: true,
        endedAt: true,
        matchStateSnapshot: true,
        status: true,
        createdAt: true,
        annotator: { select: { id: true, name: true, email: true } },
        endorsements: { include: { endorsedBy: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(sessionId: string): Promise<unknown | null> {
    return prisma.matchAnnotationSession.findUnique({
      where: { id: sessionId },
      select: { id: true, matchId: true, annotatorUserId: true, isActive: true, status: true },
    });
  }

  async listForUser(matchId: string, userId: string): Promise<unknown[]> {
    return prisma.matchAnnotationSession.findMany({
      where: { matchId, annotatorUserId: userId },
      include: { annotator: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listSuspendedForUser(userId: string): Promise<unknown[]> {
    const allSessions = await prisma.matchAnnotationSession.findMany({
      where: { annotatorUserId: userId, status: 'ABANDONED', matchStateSnapshot: { not: null } },
      select: {
        id: true,
        matchId: true,
        annotatorUserId: true,
        isActive: true,
        status: true,
        matchStateSnapshot: true,
        match: {
          select: {
            id: true,
            state: true,
            format: true,
            sportType: true,
            scheduledAt: true,
            scoreState: true,
            player1: { select: { id: true, name: true } },
            player2: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return allSessions.filter((s: { match?: { state?: string } }) => !s.match || ['IN_PROGRESS', 'FINISHED'].includes(s.match.state ?? ''));
  }

  async update(sessionId: string, data: SessionUpdateInput): Promise<unknown> {
    return prisma.matchAnnotationSession.update({
      where: { id: sessionId },
      data,
      include: { annotator: { select: { id: true, name: true, email: true } } },
    });
  }

  async createEndorsement(sessionId: string, userId: string): Promise<unknown> {
    return prisma.annotationEndorsement.create({
      data: { sessionId, endorsedByUserId: userId },
      include: { endorsedBy: { select: { id: true, name: true, email: true } } },
    });
  }

  async reactivateOrCreate(matchId: string, userId: string, existingSessions: unknown[]): Promise<unknown> {
    return prisma.$transaction(async (tx: Tx) => {
      if (existingSessions.length > 1) {
        const sessions = existingSessions as { id: string }[];
        const olderIds = sessions.slice(1).map((s) => s.id);
        await tx.matchAnnotationSession.updateMany({
          where: { id: { in: olderIds } },
          data: { status: 'ABANDONED' as AnnotationSessionStatus, isActive: false },
        });
      }
      const mostRecent = (existingSessions as { id: string }[])[0];
      if (mostRecent) {
        return tx.matchAnnotationSession.update({
          where: { id: mostRecent.id },
          data: { isActive: true, status: 'IN_PROGRESS' as AnnotationSessionStatus },
          include: { annotator: { select: { id: true, name: true, email: true } } },
        });
      }
      return tx.matchAnnotationSession.create({
        data: { matchId, annotatorUserId: userId, isActive: true, status: 'IN_PROGRESS' as AnnotationSessionStatus },
        include: { annotator: { select: { id: true, name: true, email: true } } },
      });
    });
  }

  async findMatchForSession(matchId: string): Promise<{ state: string; openForAnnotation: boolean; version: number; scoreState: unknown } | null> {
    return prisma.match.findUnique({
      where: { id: matchId },
      select: { state: true, openForAnnotation: true, version: true, scoreState: true },
    });
  }

  async findMatchScoreState(matchId: string): Promise<{ scoreState: unknown } | null> {
    return prisma.match.findUnique({ where: { id: matchId }, select: { scoreState: true } });
  }
}
