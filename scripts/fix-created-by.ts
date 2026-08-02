import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const matchesWithoutCreator = await prisma.match.findMany({
    where: {
      createdByUserId: null,
    },
    select: {
      id: true,
      player1Id: true,
    },
  });

  console.log(`Encontradas ${matchesWithoutCreator.length} partidas sem createdByUserId`);

  let updated = 0;
  for (const match of matchesWithoutCreator) {
    await prisma.match.update({
      where: { id: match.id },
      data: { createdByUserId: match.player1Id },
    });
    updated++;
  }

  console.log(`Atualizadas ${updated} partidas`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());