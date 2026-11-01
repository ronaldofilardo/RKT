import { prisma } from '@/lib/prisma';

export interface SessionContextOption {
  id: string;
  label: string;
  role: string;
  type: 'CT' | 'PARTICULAR' | 'PLATAFORMA';
}

export async function resolveAvailableContexts(userId: string): Promise<SessionContextOption[]> {
  try {
    if (!prisma?.user?.findUnique) return [];

    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        memberships: {
          where: { status: 'ACTIVE' },
          select: {
            kind: true,
            ctId: true,
            preset: true,
            ct: { select: { id: true, name: true, status: true } },
          },
        },
        coachAthleteLinks: {
          where: { status: 'ACTIVE' },
          select: { playerId: true },
          take: 1,
        },
      },
    });

    if (!row) return [];

    const contexts: SessionContextOption[] = [];

    for (const m of row.memberships) {
      if (m.ctId && m.ct) {
        if (m.ct.status === 'SUSPENDED') continue;
        contexts.push({
          id: m.ctId,
          label: `${m.ct.name} (${m.kind === 'GESTOR' ? 'Gestor' : 'Treinador'})`,
          role: m.kind,
          type: 'CT',
        });
      }
    }

    const hasParticular = row.memberships.some((m) => m.kind === 'TREINADOR' && m.ctId === null);
    const isCoach = row.memberships.some((m) => m.kind === 'TREINADOR');
    const hasLinks = (row.coachAthleteLinks?.length ?? 0) > 0;

    if (hasParticular || (isCoach && hasLinks)) {
      contexts.push({
        id: 'PARTICULAR',
        label: 'Particular (Atletas Avulsos)',
        role: 'TREINADOR',
        type: 'PARTICULAR',
      });
    }

    return contexts;
  } catch {
    return [];
  }
}
