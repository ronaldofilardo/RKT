import { NextRequest, NextResponse } from 'next/server';
import { CreateMatchInputSchema, PaginationSchema } from '@/schemas/contracts';
import { requireRole } from '@/lib/auth';
import { listMatches, createMatch } from '@/services/matchService';
import { findDuplicateMatch } from '@/services/matchSuggestionService';

export async function GET(request: NextRequest) {
  const roleCheck = await requireRole(request, 'SPECTATOR');
  if (roleCheck) return roleCheck;

  try {
    const { searchParams } = request.nextUrl;
    const state = searchParams.get('state');
    const pagination = PaginationSchema.parse({
      cursor: searchParams.get('cursor') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });
    const matches = await listMatches(state, pagination.cursor, pagination.limit);
    const nextCursor = matches.length === pagination.limit ? matches[matches.length - 1].id : null;
    return NextResponse.json({ matches, nextCursor });
  } catch (error) {
    console.error('[MATCHES GET]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const roleCheck = await requireRole(request, 'ATHLETE');
  if (roleCheck) return roleCheck;

  try {
    const body = await request.json();
    const { force, ...input } = body;

    const parsed = CreateMatchInputSchema.safeParse(input);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const accessToken = request.headers.get('authorization')?.replace('Bearer ', '');
    let currentUserId: string | undefined;
    if (accessToken) {
      try {
        const { jwtVerify } = await import('jose');
        const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
        const { payload } = await jwtVerify(accessToken, JWT_SECRET);
        currentUserId = payload.sub as string;
      } catch {
        // Ignore se token inválido
      }
    }

    if (!force) {
      const duplicate = await findDuplicateMatch(
        parsed.data.player1Id,
        parsed.data.player2Id,
        parsed.data.scheduledAt ?? null,
      );

      if (duplicate) {
        return NextResponse.json(
          {
            error: 'DUPLICATE_MATCH',
            code: 'DUPLICATE_MATCH',
            existing: {
              id: duplicate.id,
              playerP1: duplicate.player1?.name,
              playerP2: duplicate.player2?.name,
            },
          },
          { status: 409 }
        );
      }
    }

    const match = await createMatch(parsed.data, currentUserId);
    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error('[MATCHES POST]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}