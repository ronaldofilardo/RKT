import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRLSHandler } from '@/lib/auth';
import { getRLSUser } from '@/lib/rls-context';
import { reportApiError, validatedRequest, extractPagination } from '@/lib/api.logic';
import { emitMatchEvent } from '@/lib/match-events';
import { logger } from '@/lib/logger';
import { CreateCommentInputSchema } from '@/schemas/comment';

// ============================================================================
// POST /api/matches/[id]/comments
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const user = getRLSUser();
      if (!user) {
        return NextResponse.json({ error: 'FORBIDDEN', message: 'Unauthorized' }, { status: 401 });
      }
      const { id } = await params;
      const input = await validatedRequest(request, CreateCommentInputSchema);
      const { content, category, pointId } = input;

      const match = await prisma.match.findFirst({
        where: { id, deletedAt: null },
        select: { id: true },
      });

      if (!match) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'Partida não encontrada' },
          { status: 404 }
        );
      }

      const comment = await prisma.matchComment.create({
        data: {
          matchId: id,
          content,
          category: category || null,
          authorId: user.id,
          pointId: pointId || null,
        },
        include: { author: { select: { name: true } } },
      });

      emitMatchEvent(id, 'comment_created', {
        comment: {
          id: comment.id,
          content: comment.content,
          category: comment.category,
          authorName: comment.author.name,
          createdAt: comment.createdAt.toISOString(),
          hasAudioNote: false,
          audioNoteDuration: null,
        },
      });

      logger.log(`[COMMENT] Created ${comment.id} by ${user.id} in match ${id}`);

      return NextResponse.json({
        id: comment.id,
        content: comment.content,
        category: comment.category,
        authorName: comment.author.name,
        createdAt: comment.createdAt.toISOString(),
      }, { status: 201 });
    } catch (error) {
      logger.error('[COMMENT POST]', error);
      return reportApiError(error);
    }
  });
}

// ============================================================================
// GET /api/matches/[id]/comments?limit=20&cursor={id}
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const { id } = await params;
      const { limit, cursor } = extractPagination(request.nextUrl.searchParams);

      const match = await prisma.match.findFirst({
        where: { id, deletedAt: null },
        select: { id: true },
      });

      if (!match) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'Partida não encontrada' },
          { status: 404 }
        );
      }

      const where = {
        matchId: id,
        deletedAt: null,
        ...(cursor ? { createdAt: { lt: new Date(Buffer.from(cursor, 'base64').toString('utf-8')) } } : {}),
      };

      const comments = await prisma.matchComment.findMany({
        where,
        select: {
          id: true,
          content: true,
          category: true,
          author: { select: { name: true } },
          createdAt: true,
          audioNoteDuration: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
      });

      const hasMore = comments.length > limit;
      const items = hasMore ? comments.slice(0, limit) : comments;
      const nextCursor = hasMore && items.length > 0
        ? Buffer.from(items[items.length - 1].createdAt.toISOString()).toString('base64')
        : null;

      return NextResponse.json({
        comments: items.map((c) => ({
          id: c.id,
          content: c.content,
          category: c.category,
          authorName: c.author.name,
          createdAt: c.createdAt.toISOString(),
          hasAudioNote: c.audioNoteDuration != null,
          audioNoteDuration: c.audioNoteDuration,
        })),
        nextCursor,
      });
    } catch (error) {
      logger.error('[COMMENT GET]', error);
      return reportApiError(error);
    }
  });
}
