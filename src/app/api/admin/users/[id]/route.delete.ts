import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withRLSHandler } from '@/lib/auth';
import { deleteUser } from '@/services/adminService';

export async function handleDeleteUser(
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
