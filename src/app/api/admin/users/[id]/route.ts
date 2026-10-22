import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withRLSHandler } from '@/lib/auth';
import { UpdateUserInputSchema } from '@/schemas/user';
import { updateUser, deleteUser } from '@/services/adminService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ADMIN', async () => {
    try {
      const { id } = await params;
      const parsedBody = UpdateUserInputSchema.safeParse(await request.json().catch(() => null));
      if (!parsedBody.success) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: parsedBody.error.issues[0]?.message ?? 'Dados inválidos' },
          { status: 400 }
        );
      }

      const result = await updateUser(id, parsedBody.data);

      if ('error' in result) {
        if (result.error === 'USER_NOT_FOUND') {
          return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
        }
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json(result);
    } catch (error) {
      logger.error('[ADMIN USER PATCH]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ADMIN', async () => {
    try {
      const { id } = await params;
      const result = await deleteUser(id);

      if ('error' in result) {
        if (result.error === 'USER_NOT_FOUND') {
          return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
        }
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      logger.error('[ADMIN USER DELETE]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}
