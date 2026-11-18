import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getGestorCtId, denyGestor } from '../_logic';
import { withAccessHandler } from '@/lib/access-handler';

export async function GET(request: NextRequest) {
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado.');

  return withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId }), async () => {
    try {
      const items = await prisma.playerCT.findMany({
        where: { ctId, status: 'PENDING' },
        include: {
          player: {
            select: {
              id: true,
              name: true,
              birthDate: true,
              age: true,
              gender: true,
              guardianLinks: {
                where: { status: 'ACTIVE', revokedAt: null },
                select: {
                  relation: true,
                  guardian: { select: { name: true, email: true } },
                },
                take: 1,
              },
              consentRecords: {
                where: { revokedAt: null },
                select: { purpose: true },
              },
            },
          },
        },
        orderBy: { since: 'desc' },
      });

      const formatted = items.map((pct) => ({
        id: pct.id,
        playerId: pct.playerId,
        playerName: pct.player.name,
        birthDate: pct.player.birthDate ? pct.player.birthDate.toISOString() : null,
        age: pct.player.age,
        gender: pct.player.gender,
        relation: pct.player.guardianLinks[0]?.relation ?? 'Responsável',
        guardianName: pct.player.guardianLinks[0]?.guardian?.name ?? 'Responsável Legal',
        guardianEmail: pct.player.guardianLinks[0]?.guardian?.email ?? null,
        consents: {
          DATA: pct.player.consentRecords.some((c) => c.purpose === 'DATA'),
          BROADCAST: pct.player.consentRecords.some((c) => c.purpose === 'BROADCAST'),
          STATS: pct.player.consentRecords.some((c) => c.purpose === 'STATS'),
        },
        requestedAt: pct.since.toISOString(),
      }));

      return NextResponse.json({ count: formatted.length, items: formatted }, { status: 200 });
    } catch (error) {
      logger.error('[GESTOR REQUESTS GET]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}
