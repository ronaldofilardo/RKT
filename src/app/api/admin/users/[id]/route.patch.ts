import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withRLSHandler } from '@/lib/auth';
import { updateUser } from '@/services/adminService';

export async function handlePatchUser(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ADMIN', async () => {
    try {
      const { id } = await params;
      const body = await request.json();

      const validRoles = ['ADMIN', 'GESTOR', 'COACH', 'ATHLETE', 'SPECTATOR'];
      if (body.role && !validRoles.includes(body.role)) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: `Role inválida. Use: ${validRoles.join(', ')}` },
          { status: 400 }
        );
      }

      const result = await updateUser(id, body);

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

