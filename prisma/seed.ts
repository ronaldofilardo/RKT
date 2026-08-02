import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('12345678', 10);

  const athlete1 = await prisma.player.upsert({
    where: { email: 'play@email.com' },
    update: {},
    create: {
      name: 'Jogador Atleta',
      email: 'play@email.com',
      club: 'Clube Principal',
      role: 'ATHLETE',
      passwordHash,
    },
  });

  const athlete2 = await prisma.player.upsert({
    where: { email: 'player2@email.com' },
    update: {},
    create: {
      name: 'Segundo Jogador',
      email: 'player2@email.com',
      club: 'Clube Secundário',
      role: 'ATHLETE',
      passwordHash,
    },
  });

  const coach = await prisma.player.upsert({
    where: { email: 'coach@email.com' },
    update: {},
    create: {
      name: 'Técnico',
      email: 'coach@email.com',
      club: 'Comissão Técnica',
      role: 'COACH',
      passwordHash,
    },
  });

  const admin = await prisma.player.upsert({
    where: { email: 'admin@email.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@email.com',
      club: 'Administração',
      role: 'ADMIN',
      passwordHash,
    },
  });

  console.log('Seed concluído:');
  console.log({
    athlete1: { id: athlete1.id, name: athlete1.name, email: athlete1.email, role: athlete1.role },
    athlete2: { id: athlete2.id, name: athlete2.name, email: athlete2.email, role: athlete2.role },
    coach: { id: coach.id, name: coach.name, email: coach.email, role: coach.role },
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
