/**
 * Seed rápido: vincula um Player ao atleta anotador existente (ou cria se faltar).
 * Uso: pnpm tsx scripts/seed-athlete.ts
 */

import { prisma } from '@/lib/prisma';

async function main() {
  const email = 'anotador@rkt.com';
  const cpf = '12345678901';

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`Usuário ${email} não encontrado. Rode o seed de usuário primeiro.`);
    process.exit(1);
  }

  const existingPlayer = await prisma.player.findFirst({ where: { userId: user.id } });
  if (existingPlayer) {
    console.log(`Player já vinculado: ${existingPlayer.id} (${existingPlayer.name})`);
    return;
  }

  const player = await prisma.player.create({
    data: {
      name: user.name,
      email: user.email,
      gender: 'MASCULINO',
      dominance: 'DESTRO',
      userId: user.id,
      createdByUserId: user.id,
    },
  });

  console.log(`Player criado: ${player.id}`);
  console.log(`Usuário: ${user.id} (${user.email})`);
  console.log(`CPF do usuário: ${user.cpf}`);
  console.log(`Senha: 123456`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
