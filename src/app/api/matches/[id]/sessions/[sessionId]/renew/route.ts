import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';
import { reportApiError } from '@/lib/api.logic';
import { withPermissionHandler } from '@/lib/auth';
import { SessionPathParamsSchema } from '@/schemas/comment';
import { ZodError } from 'zod';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; sessionId: string }> }
) {
  return withPermissionHandler(request, 'annotate:session', async () => {
    try {
      const { sessionId } = SessionPathParamsSchema.parse(await context.params);

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
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: 'INVALID_PARAMS', message: 'Parâmetros de sessão inválidos' },
          { status: 400 }
        );
      }
      return reportApiError(error);
    }
  });
}
