import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ID do usuário Play (atual)
  const CURRENT_USER_ID = 'cmqnphtn4000210onlmvgjjvy';

  // Atualiza todas as partidas para ter o usuário atual como criador
  const result = await prisma.match.updateMany({
    where: {
      createdByUserId: {
        not: CURRENT_USER_ID,
      },
    },
    data: {
      createdByUserId: CURRENT_USER_ID,
    },
  });

  console.log(`Atualizadas ${result.count} partidas para createdByUserId = ${CURRENT_USER_ID}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());