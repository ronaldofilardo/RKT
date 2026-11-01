import { NextRequest, NextResponse } from 'next/server';
import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';
import { reportApiError } from '@/lib/api.logic';
import { activateParticularCoach } from './particular.logic';

export async function POST(request: NextRequest) {
  try {
    const user = await getAccessUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Token requerido' }, { status: 401 });
    }

    const result = await activateParticularCoach(user.id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, message: result.message }, { status: 201 });
  } catch (error) {
    return reportApiError(error);
  }
}

