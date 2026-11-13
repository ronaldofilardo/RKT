import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAccessHandler } from '@/lib/access-handler';
import { MATCH_SELECT } from './route-match-select';
import { fetchMatchPointExtras } from './route-get-extras.queries';
import { handleMatchPut } from './route-put.logic';
import { handleMatchDelete } from './route-delete.logic';
import { resolveGetMatchAccess, type LoadedMatchForGet } from './route-get-access.logic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAccessHandler(request, null, null, async ({ actor }) => {
    const { id } = await params;
    const match = await prisma.match.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...MATCH_SELECT,
        annotationSessions: {
          select: { annotatorUserId: true },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
    }

    const access = await resolveGetMatchAccess(actor, match as unknown as LoadedMatchForGet);
    if (!access.ok) return access.response;
    if (access.isTemplate) {
      return NextResponse.json({ ...match, myAnnotationId: access.myAnnotationId ?? null });
    }

    const extras = await fetchMatchPointExtras(id);
    return NextResponse.json({ ...match, ...extras });
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAccessHandler(request, 'match:annotate', null, async ({ user }) => {
    const { id } = await params;
    return handleMatchPut(request, user.id, id);
  });
}

export const PATCH = PUT;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAccessHandler(request, 'match:annotate', null, async ({ user }) => {
    const { id } = await params;
    return handleMatchDelete(request, user.id, id);
  });
}
