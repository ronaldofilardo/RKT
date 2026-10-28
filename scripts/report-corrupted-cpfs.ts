import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('[AUDIT P6] Verificando usuários com e-mail armazenado na coluna User.cpf...');
  try {
    const corruptedUsers = await prisma.user.findMany({
      where: {
        cpf: {
          contains: '@',
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        role: true,
        createdAt: true,
      },
    });

    console.log(`[AUDIT P6] Total de registros encontrados com anomalia: ${corruptedUsers.length}`);
    if (corruptedUsers.length > 0) {
      console.table(
        corruptedUsers.map((u) => ({
          ID: u.id,
          Nome: u.name,
          Email: u.email,
          'CPF (com e-mail)': u.cpf,
          Role: u.role,
          CriadoEm: u.createdAt.toISOString(),
        })),
      );
      console.log('\n[RECOMENDAÇÃO]: Linhas que contêm e-mail no CPF devem ter o CPF regularizado na Fase 3.');
    } else {
      console.log('[AUDIT P6] Nenhum usuário com CPF corrompido encontrado.');
    }
  } catch (err) {
    console.error('[AUDIT P6] Erro ao consultar banco:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

