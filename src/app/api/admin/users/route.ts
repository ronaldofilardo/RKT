import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { CreateUserInputSchema, ListUsersInputSchema } from '@/schemas/contracts';
import { withRLSHandler } from '@/lib/auth';
import { listAllUsers, createUser } from '@/services/adminService';
import { validatedRequest, handleApiError } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  return withRLSHandler(request, 'ADMIN', async () => {
    try {
      const { searchParams } = request.nextUrl;

      // Validar query params com Zod
      const parsed = ListUsersInputSchema.safeParse({
        cursor: searchParams.get('cursor') ?? undefined,
        limit: searchParams.get('limit') ?? '20',
        role: searchParams.get('role') ?? undefined,
      });

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const { cursor, limit, role } = parsed.data;
      const users = await listAllUsers({ cursor, limit, role });
      const nextCursor = users.length === limit ? users[users.length - 1].id : null;

      return NextResponse.json({ data: { users, nextCursor } });
    } catch (error) {
      logger.error('[ADMIN USERS GET]', error);
      return handleApiError(error);
    }
  });
}

export async function POST(request: NextRequest) {
  return withRLSHandler(request, 'ADMIN', async () => {
    try {
      // Validar body com Zod
      const body = await validatedRequest(request, CreateUserInputSchema);

      const result = await createUser(body);

      if ('error' in result) {
        if (result.error === 'EMAIL_ALREADY_EXISTS') {
          return NextResponse.json(
            { error: 'EMAIL_ALREADY_EXISTS', message: 'Email já cadastrado' },
            { status: 409 }
          );
        }
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({ data: result }, { status: 201 });
    } catch (error) {
      logger.error('[ADMIN USERS POST]', error);
      return handleApiError(error);
    }
  });
}
