import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';
import { handleApiError } from '@/lib/api-helpers';
import { withPermissionHandler } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; sessionId: string }> }
) {
  return withPermissionHandler(request, 'annotate:session', async () => {
    try {
      const { sessionId } = await context.params;

      const session = await prisma.matchAnnotationSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new NotFoundError('Sessão', sessionId);
      }

      await prisma.matchAnnotationSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });

      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return handleApiError(error);
    }
  });
}
