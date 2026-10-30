import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const memberships = await prisma.membership.findMany({
    where: {
      kind: { in: ['GESTOR', 'TREINADOR'] },
      status: 'ACTIVE',
      ctId: { not: null },
    },
    select: { userId: true, ctId: true },
  });

  const userCtMap = new Map<string, string>();
  for (const m of memberships) {
    if (m.ctId && !userCtMap.has(m.userId)) {
      userCtMap.set(m.userId, m.ctId);
    }
  }

  const managerUserIds = Array.from(userCtMap.keys());
  if (managerUserIds.length === 0) {
    console.log('Nenhum gestor/treinador com CT ativo encontrado.');
    return;
  }

  const players = await prisma.player.findMany({
    where: {
      createdByUserId: { in: managerUserIds },
    },
    include: {
      playerCts: true,
    },
  });

  let linkedCount = 0;
  for (const player of players) {
    const targetCtId = userCtMap.get(player.createdByUserId!);
    if (!targetCtId) continue;

    const alreadyLinked = player.playerCts.some((pc) => pc.ctId === targetCtId);
    if (!alreadyLinked) {
      await prisma.playerCT.create({
        data: {
          playerId: player.id,
          ctId: targetCtId,
          status: 'ACTIVE',
        },
      });
      console.log(`Atleta "${player.name}" (${player.id}) vinculado ao CT ${targetCtId}.`);
      linkedCount++;
    }
  }

  console.log(`Concluído. Total de atletas vinculados: ${linkedCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

