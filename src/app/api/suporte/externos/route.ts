import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';

type PlayerExternal = {
  id: string;
  name: string;
  club: string | null;
  city: string | null;
  state: string | null;
  gender: string | null;
  age: number | null;
  rankings: unknown;
  createdAt: Date;
  createdByUserId: string | null;
  createdByName: string | null;
  createdByEmail: string | null;
};

export async function GET(request: NextRequest) {
  return withAccessHandler(request, 'athlete:search', null, async () => {
    try {
      // Atletas sem conta no sistema (sem userId vinculado, null ou vazio)
      const players: PlayerExternal[] = await prisma.player.findMany({
        where: {
          OR: [{ userId: null }, { userId: '' }],
        },
        select: {
          id: true,
          name: true,
          club: true,
          city: true,
          state: true,
          gender: true,
          age: true,
          rankings: true,
          createdAt: true,
          createdByUserId: true,
          createdByUser: {
            select: {
              name: true,
              email: true,
            },
          },
        } as any,
        orderBy: { name: 'asc' },
        take: 200,
      }) as unknown as PlayerExternal[];

      // Clubes distintos mencionados por esses atletas externos
      const clubsSet = new Set<string>();
      for (const p of players) {
        if (p.club) clubsSet.add(p.club);
      }

      // Buscar treinadores-centros cadastrados para cruzar status
      const registeredCenters = await prisma.trainingCenter.findMany({
        select: { name: true, status: true },
      }) as Array<{ name: string; status: string }>;
      const centerStatusByName = new Map<string, string>();
      for (const c of registeredCenters) {
        centerStatusByName.set(c.name, c.status);
      }

      // Para cidades/estados, buscar jogadores por clube para preencher cidade/estado
      const clubsWithLocation = await Promise.all(
        Array.from(clubsSet).map(async (club) => {
          let city: string | null = null;
          let state: string | null = null;
          try {
            const sample = await prisma.player.findFirst({
              where: {
                club,
                OR: [{ userId: null }, { userId: '' }],
              },
              select: { city: true, state: true },
            } as any) as { city: string | null; state: string | null } | null;
            city = sample?.city ?? null;
            state = sample?.state ?? null;
          } catch {
            // city/state podem não existir no cliente Prisma gerado ainda
          }
          const status = centerStatusByName.get(club) ?? null;
          return { club, city: city ?? '', state: state ?? '', status, inSystem: Boolean(status) };
        }),
      );

      return NextResponse.json({
        athletes: players.map((p) => ({
          id: p.id,
          name: p.name,
          club: p.club ?? null,
          city: p.city ?? null,
          state: p.state ?? null,
          gender: p.gender ?? null,
          age: p.age ?? null,
          rankings: p.rankings ?? null,
          createdAt: p.createdAt.toISOString(),
          createdByUserId: p.createdByUserId ?? null,
          createdByName: (p as any).createdByUser?.name ?? null,
          createdByEmail: (p as any).createdByUser?.email ?? null,
        })),
        clubs: clubsWithLocation,
        totalAthletes: players.length,
        totalClubs: clubsWithLocation.length,
      }, { status: 200 });
    } catch (error) {
      logger.error('[SUPORTE EXTERNOS GET]', error);
      return reportApiError(error);
    }
  });
}
