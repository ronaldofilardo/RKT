import { NextRequest, NextResponse } from 'next/server';
import { PaginationSchema } from '@/schemas/contracts';
import { requireRole } from '@/lib/auth';
import { listPlayers, createPlayer } from '@/services/playerService';

export async function GET(request: NextRequest) {
  const roleCheck = await requireRole(request, 'SPECTATOR');
  if (roleCheck) return roleCheck;

  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'userId é obrigatório' }, { status: 400 });
    }
    
    const pagination = PaginationSchema.parse({
      cursor: searchParams.get('cursor') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });
    
    const players = await listPlayers(pagination.cursor, pagination.limit, userId);
    const nextCursor = players.length === pagination.limit ? players[players.length - 1].id : null;
    return NextResponse.json({ players, nextCursor });
  } catch (error) {
    console.error('[PLAYERS GET]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const roleCheck = await requireRole(request, 'ATHLETE');
  if (roleCheck) return roleCheck;

  try {
    const body = await request.json();
    const { name, gender, age, dominance, backhand, ranking, rankings } = body;
    
    const userId = request.headers.get('x-user-id');

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Nome é obrigatório (mín 2 chars)' }, { status: 400 });
    }

    if (gender && !['MALE', 'FEMALE'].includes(gender)) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Gender must be MALE or FEMALE' }, { status: 400 });
    }

    if (age !== undefined && age !== null && (typeof age !== 'number' || age < 1 || age > 120)) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Age must be between 1 and 120' }, { status: 400 });
    }

    if (dominance && !['LEFT', 'RIGHT'].includes(dominance)) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Dominance must be LEFT or RIGHT' }, { status: 400 });
    }

    if (backhand && !['ONE_HANDED', 'TWO_HANDED'].includes(backhand)) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Backhand must be ONE_HANDED or TWO_HANDED' }, { status: 400 });
    }

    if (ranking !== undefined && ranking !== null && (typeof ranking !== 'number' || ranking < 1)) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Ranking must be a positive number' }, { status: 400 });
    }

    if (rankings !== undefined && rankings !== null) {
      if (typeof rankings !== 'object' || Array.isArray(rankings)) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Rankings must be an object' }, { status: 400 });
      }
      const validRankingTypes = ['ESTADUAL', 'BRASILEIRO', 'COSAT', 'ITS', 'WTA_ATP'];
      for (const [key, value] of Object.entries(rankings)) {
        if (!validRankingTypes.includes(key)) {
          return NextResponse.json({ error: 'VALIDATION_ERROR', message: `Invalid ranking type: ${key}` }, { status: 400 });
        }
        if (typeof value !== 'number' || value < 1) {
          return NextResponse.json({ error: 'VALIDATION_ERROR', message: `Ranking ${key} must be a positive number` }, { status: 400 });
        }
      }
    }

    const player = await createPlayer({
      name: name.trim(),
      gender,
      age,
      dominance,
      backhand,
      ranking,
      rankings,
      createdByUserId: userId || undefined,
    });
    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error('[PLAYERS POST]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
