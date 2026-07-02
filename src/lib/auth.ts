import { NextRequest, NextResponse } from 'next/server';
import type { Role } from '@/schemas/contracts';
import { jwtVerify } from 'jose';
import { setRLSUser } from './rls-context';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 5,
  GESTOR: 4,
  COACH: 3,
  ATHLETE: 2,
  SPECTATOR: 1,
};

export async function requireRole(request: NextRequest, minRole: Role): Promise<NextResponse | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Token de acesso requerido' },
      { status: 401 }
    );
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = payload.role as Role;

    if (!userRole || ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[minRole]) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: `Requer role ${minRole} ou superior. Role atual: ${userRole ?? 'nenhum'}`,
        },
        { status: 403 }
      );
    }

    setRLSUser({ id: payload.sub as string, role: userRole });

    return null;
  } catch {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Token inválido ou expirado' },
      { status: 401 }
    );
  }
}

export async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    setRLSUser({ id: payload.sub as string, role: payload.role as Role });
    return { id: payload.sub as string, role: payload.role as Role };
  } catch {
    return null;
  }
}
