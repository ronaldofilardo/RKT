import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reportApiError, extractPagination } from '@/lib/api.logic';
import { logger } from '@/lib/logger';

// ============================================================================
// GET /api/matches/[id]/comments?limit=20&cursor={id}
// ============================================================================

export async function getCommentsResponse(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
}
