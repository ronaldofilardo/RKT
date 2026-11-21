import { PrismaClient } from '@prisma/client';
import { assertDbTarget, describeDbTarget } from '../src/lib/db/db-target';

const TARGET_CT_ID = 'cmw49xfb600017kwdm0x2g2v5';

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

async function main() {
  const target = assertDbTarget();
  console.log(`[db] Conectado: ${describeDbTarget(target)} (env=${target.env})`);

  const prisma = new PrismaClient({ datasources: { db: { url: target.url } } });

  try {
    // 1. Obter atletas do CT
    const ctLinks = await prisma.playerCT.findMany({
      where: { ctId: TARGET_CT_ID },
      include: {
        player: {
          include: {
            user: { select: { id: true, email: true } },
            _count: {
              select: {
                matchesAsPlayer1: true,
                matchesAsPlayer2: true,
                matchesAsPlayer1Partner: true,
                matchesAsPlayer2Partner: true,
              },
            },
          },
        },
      },
    });

    console.log(`Total de atletas no CT: ${ctLinks.length}`);

    const ctAthletesMap = new Map<string, typeof ctLinks[0]['player']>();
    for (const link of ctLinks) {
      if (link.player && !link.player.mergedIntoId) {
        ctAthletesMap.set(normalizeName(link.player.name), link.player);
      }
    }

    // 2. Buscar TODOS os atletas ativos (mergedIntoId: null) fora do CT que têm esses nomes
    const allActivePlayers = await prisma.player.findMany({
      where: {
        mergedIntoId: null,
      },
      include: {
        user: { select: { id: true, email: true } },
        playerCts: {
          include: {
            ct: { select: { id: true, name: true, slug: true } },
          },
        },
        _count: {
          select: {
            matchesAsPlayer1: true,
            matchesAsPlayer2: true,
            matchesAsPlayer1Partner: true,
            matchesAsPlayer2Partner: true,
          },
        },
      },
    });

    console.log(`Total de jogadores ativos no banco: ${allActivePlayers.length}\n`);

    const matchesFound: Array<{
      name: string;
      ctPlayer: any;
      outsidePlayers: any[];
    }> = [];

    for (const [normName, ctPlayer] of ctAthletesMap.entries()) {
      const outside = allActivePlayers.filter(p => {
        if (p.id === ctPlayer.id) return false;
        return normalizeName(p.name) === normName;
      });

      if (outside.length > 0) {
        matchesFound.push({
          name: ctPlayer.name,
          ctPlayer,
          outsidePlayers: outside,
        });
      }
    }

    console.log(`============================================================`);
    console.log(`ATLETAS COM MESMO NOME FORA DO CT: ${matchesFound.length} grupo(s)`);
    console.log(`============================================================\n`);

    for (const group of matchesFound) {
      const ctMatches =
        group.ctPlayer._count.matchesAsPlayer1 +
        group.ctPlayer._count.matchesAsPlayer2 +
        group.ctPlayer._count.matchesAsPlayer1Partner +
        group.ctPlayer._count.matchesAsPlayer2Partner;

      console.log(`▶ NOME: "${group.name}"`);
      console.log(`   [CT] ID: ${group.ctPlayer.id} | Partidas: ${ctMatches} | User: ${group.ctPlayer.user?.email || 'Sem conta'} | Nasc: ${group.ctPlayer.birthDate ? group.ctPlayer.birthDate.toISOString().slice(0, 10) : 'N/A'}`);
      
      for (const out of group.outsidePlayers) {
        const outMatches =
          out._count.matchesAsPlayer1 +
          out._count.matchesAsPlayer2 +
          out._count.matchesAsPlayer1Partner +
          out._count.matchesAsPlayer2Partner;
        const cts = out.playerCts.map((c: any) => c.ct.name).join(', ') || 'Nenhum (avulso/pool)';
        console.log(`   [FORA] ID: ${out.id} | Partidas: ${outMatches} | CTs: [${cts}] | User: ${out.user?.email || 'Sem conta'} | Nasc: ${out.birthDate ? out.birthDate.toISOString().slice(0, 10) : 'N/A'}`);
      }
      console.log('');
    }

  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
