import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { updateUser, deleteUser } from '@/services/adminService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleCheck = await requireRole(request, 'ADMIN');
  if (roleCheck) return roleCheck;

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
    console.error('[ADMIN USER PATCH]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleCheck = await requireRole(request, 'ADMIN');
  if (roleCheck) return roleCheck;

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
    console.error('[ADMIN USER DELETE]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
