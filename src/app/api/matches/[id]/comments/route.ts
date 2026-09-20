import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRLSHandler } from '@/lib/auth';
import { getRLSUser } from '@/lib/rls-context';
import { handleApiError } from '@/lib/api-helpers';
import { emitMatchEvent } from '@/lib/match-events';
import { logger } from '@/lib/logger';

const MAX_CONTENT_LENGTH = 500;

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
      const body = await request.json();
      const { content, category, pointId } = body ?? {};

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json(
          { error: 'INVALID_CONTENT', message: 'Conteúdo do comentário é obrigatório' },
          { status: 400 }
        );
      }

      if (content.length > MAX_CONTENT_LENGTH) {
        return NextResponse.json(
          { error: 'CONTENT_TOO_LONG', message: `Comentário deve ter no máximo ${MAX_CONTENT_LENGTH} caracteres` },
          { status: 400 }
        );
      }

      if (category !== undefined && category !== null && typeof category !== 'string') {
        return NextResponse.json(
          { error: 'INVALID_CATEGORY', message: 'Categoria deve ser uma string' },
          { status: 400 }
        );
      }

      if (pointId !== undefined && pointId !== null && typeof pointId !== 'string') {
        return NextResponse.json(
          { error: 'INVALID_POINT_ID', message: 'pointId deve ser uma string' },
          { status: 400 }
        );
      }

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
          content: content.trim(),
          category: category?.trim() || null,
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
      return handleApiError(error);
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
      const { searchParams } = new URL(request.url);
      const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 100);
      const cursor = searchParams.get('cursor');

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
        include: { author: { select: { name: true } } },
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
          hasAudioNote: c.audioNote !== null,
          audioNoteDuration: c.audioNoteDuration,
        })),
        nextCursor,
      });
    } catch (error) {
      logger.error('[COMMENT GET]', error);
      return handleApiError(error);
    }
  });
}
