import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Criar ou atualizar Usuário Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rkt.com' },
    update: {
      passwordHash,
      cpf: '87545772920',
      role: 'ADMIN',
    },
    create: {
      name: 'Administrador do Sistema',
      email: 'admin@rkt.com',
      cpf: '87545772920',
      role: 'ADMIN',
      passwordHash,
      club: 'Administração Geral',
    },
  });

  // 2. Criar ou atualizar Usuário Anotador
  const annotator = await prisma.user.upsert({
    where: { email: 'anotador@rkt.com' },
    update: {
      passwordHash,
      cpf: '04703084945',
      role: 'ANNOTATOR',
    },
    create: {
      name: 'Anotador Oficial',
      email: 'anotador@rkt.com',
      cpf: '04703084945',
      role: 'ANNOTATOR',
      passwordHash,
      club: 'Clube Central',
    },
  });

  // 3. Criar Atletas no Catálogo Compartilhado (Player)
  const p1 = await prisma.player.upsert({
    where: { id: 'seed_player_alcaraz' },
    update: {},
    create: {
      id: 'seed_player_alcaraz',
      name: 'Carlos Alcaraz',
      dominance: 'RIGHT_HANDED',
      backhand: 'TWO_HANDED',
      ranking: 1,
      gender: 'MALE',
      club: 'Espanha',
    },
  });

  const p2 = await prisma.player.upsert({
    where: { id: 'seed_player_sinner' },
    update: {},
    create: {
      id: 'seed_player_sinner',
      name: 'Jannik Sinner',
      dominance: 'RIGHT_HANDED',
      backhand: 'TWO_HANDED',
      ranking: 2,
      gender: 'MALE',
      club: 'Itália',
    },
  });

  console.log('Seed concluído com sucesso!');
  console.log({
    admin: { id: admin.id, name: admin.name, email: admin.email, cpf: admin.cpf, role: admin.role },
    annotator: { id: annotator.id, name: annotator.name, email: annotator.email, cpf: annotator.cpf, role: annotator.role },
    players: [p1.name, p2.name],
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
