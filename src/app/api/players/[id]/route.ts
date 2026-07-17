import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getPlayerById, updatePlayer } from '@/services/playerService';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const roleCheck = await requireRole(request, 'SPECTATOR');
  if (roleCheck) return roleCheck;

  try {
    const { id } = await params;
    const player = await getPlayerById(id);
    if (!player) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Atleta não encontrado' }, { status: 404 });
    }
    return NextResponse.json(player);
  } catch (error) {
    console.error('[PLAYERS GET]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const roleCheck = await requireRole(request, 'ATHLETE');
  if (roleCheck) return roleCheck;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, gender, birthDate, dominance, backhand, rankings } = body;

    const existing = await getPlayerById(id);
    if (!existing) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Atleta não encontrado' }, { status: 404 });
    }

    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Nome é obrigatório (mín 2 chars)' }, { status: 400 });
    }

    if (gender !== undefined && gender !== null && !['MALE', 'FEMALE'].includes(gender)) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Gender must be MALE or FEMALE' }, { status: 400 });
    }

    if (dominance !== undefined && dominance !== null && !['LEFT', 'RIGHT'].includes(dominance)) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Dominance must be LEFT or RIGHT' }, { status: 400 });
    }

    if (backhand !== undefined && backhand !== null && !['ONE_HANDED', 'TWO_HANDED'].includes(backhand)) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Backhand must be ONE_HANDED or TWO_HANDED' }, { status: 400 });
    }

    let parsedBirthDate: Date | undefined = undefined;
    let calculatedAge: number | undefined = undefined;

    if (birthDate !== undefined && birthDate !== null) {
      parsedBirthDate = new Date(birthDate);
      if (isNaN(parsedBirthDate.getTime())) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Data de nascimento inválida' }, { status: 400 });
      }
      calculatedAge = new Date().getFullYear() - parsedBirthDate.getFullYear();
    }

    if (rankings !== undefined && rankings !== null) {
      if (typeof rankings !== 'object' || Array.isArray(rankings)) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Rankings must be an object' }, { status: 400 });
      }
      const validRankingTypes = ['ESTADUAL', 'CBT', 'COSAT', 'ITF', 'ATP', 'WTA'];
      for (const [key, value] of Object.entries(rankings)) {
        if (!validRankingTypes.includes(key)) {
          return NextResponse.json({ error: 'VALIDATION_ERROR', message: `Invalid ranking type: ${key}` }, { status: 400 });
        }
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return NextResponse.json({ error: 'VALIDATION_ERROR', message: `Ranking ${key} must be an object with position` }, { status: 400 });
        }
        const entry = value as Record<string, unknown>;
        if (typeof entry.position !== 'number' || entry.position < 1) {
          return NextResponse.json({ error: 'VALIDATION_ERROR', message: `Ranking ${key} position must be a positive number` }, { status: 400 });
        }
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (gender !== undefined) updateData.gender = gender;
    if (calculatedAge !== undefined) updateData.age = calculatedAge;
    if (parsedBirthDate !== undefined) updateData.birthDate = parsedBirthDate;
    if (dominance !== undefined) updateData.dominance = dominance;
    if (backhand !== undefined) updateData.backhand = backhand;
    if (rankings !== undefined) updateData.rankings = rankings;

    const updated = await updatePlayer(id, updateData as Parameters<typeof updatePlayer>[1]);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PLAYERS PUT]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
