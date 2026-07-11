import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({
    select: {
      id: true,
      createdByUserId: true,
      player1: { select: { id: true, name: true, email: true } },
      player2: { select: { id: true, name: true, email: true } },
      nickname: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  console.log('Partidas recentes:');
  matches.forEach(m => {
    console.log(`ID: ${m.id}`);
    console.log(`  createdByUserId: ${m.createdByUserId}`);
    console.log(`  player1: ${m.player1.name} (${m.player1.id})`);
    console.log(`  player2: ${m.player2.name} (${m.player2.id})`);
    console.log(`  nickname: ${m.nickname}`);
    console.log('---');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());