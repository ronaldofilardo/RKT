import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type OwnedComment = { id: string; authorId: string; audioNote?: Buffer | null };

export async function requireOwnedComment(
  id: string,
  commentId: string,
  userId: string,
  forbiddenMessage: string,
  select: { id: true; authorId: true; audioNote?: true },
): Promise<{ comment: OwnedComment } | { response: NextResponse }> {
  const comment = await prisma.matchComment.findFirst({
    where: { id: commentId, matchId: id, deletedAt: null },
    select,
  });

  if (!comment) {
    return {
      response: NextResponse.json(
        { error: 'NOT_FOUND', message: 'Comentário não encontrado' },
        { status: 404 }
      ),
    };
  }

  if (comment.authorId !== userId) {
    return {
      response: NextResponse.json(
        { error: 'FORBIDDEN', message: forbiddenMessage },
        { status: 403 }
      ),
    };
  }

  return { comment: comment as OwnedComment };
}
