import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { listAllUsers, createUser } from '@/services/adminService';

export async function GET(request: NextRequest) {
  const roleCheck = await requireRole(request, 'ADMIN');
  if (roleCheck) return roleCheck;

  try {
    const users = await listAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('[ADMIN USERS GET]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const roleCheck = await requireRole(request, 'ADMIN');
  if (roleCheck) return roleCheck;

  try {
    const body = await request.json();
    const { name, email, password, role, club } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'name, email, password e role são obrigatórios' },
        { status: 400 }
      );
    }

    const validRoles = ['ADMIN', 'GESTOR', 'COACH', 'ATHLETE', 'SPECTATOR'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: `Role inválida. Use: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await createUser({ name, email, password, role, club });

    if ('error' in result) {
      if (result.error === 'EMAIL_ALREADY_EXISTS') {
        return NextResponse.json(
          { error: 'EMAIL_ALREADY_EXISTS', message: 'Email já cadastrado' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[ADMIN USERS POST]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
