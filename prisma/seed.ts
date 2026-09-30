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

  // 4. Usuários e Players para Testes E2E
  const e2ePasswordHash = await bcrypt.hash('12345678', 10);

  const athlete1 = await prisma.user.upsert({
    where: { email: 'play@email.com' },
    update: {
      passwordHash: e2ePasswordHash,
      role: 'ANNOTATOR',
    },
    create: {
      name: 'Jogador Atleta',
      email: 'play@email.com',
      cpf: '11111111111',
      role: 'ANNOTATOR',
      passwordHash: e2ePasswordHash,
      club: 'Clube E2E',
    },
  });

  await prisma.player.upsert({
    where: { id: athlete1.id },
    update: { name: athlete1.name },
    create: {
      id: athlete1.id,
      name: athlete1.name,
      dominance: 'RIGHT_HANDED',
      backhand: 'TWO_HANDED',
      ranking: 10,
      gender: 'MALE',
      club: 'Clube E2E',
    },
  });

  const athlete2 = await prisma.user.upsert({
    where: { email: 'player2@email.com' },
    update: {
      passwordHash: e2ePasswordHash,
      role: 'ANNOTATOR',
    },
    create: {
      name: 'Segundo Jogador',
      email: 'player2@email.com',
      cpf: '22222222222',
      role: 'ANNOTATOR',
      passwordHash: e2ePasswordHash,
      club: 'Clube E2E',
    },
  });

  await prisma.player.upsert({
    where: { id: athlete2.id },
    update: { name: athlete2.name },
    create: {
      id: athlete2.id,
      name: athlete2.name,
      dominance: 'RIGHT_HANDED',
      backhand: 'TWO_HANDED',
      ranking: 20,
      gender: 'MALE',
      club: 'Clube E2E',
    },
  });

  const coach = await prisma.user.upsert({
    where: { email: 'coach@email.com' },
    update: {
      passwordHash: e2ePasswordHash,
      role: 'ANNOTATOR',
    },
    create: {
      name: 'Técnico',
      email: 'coach@email.com',
      cpf: '33333333333',
      role: 'ANNOTATOR',
      passwordHash: e2ePasswordHash,
      club: 'Clube E2E',
    },
  });

  const adminE2E = await prisma.user.upsert({
    where: { email: 'admin@email.com' },
    update: {
      passwordHash: e2ePasswordHash,
      role: 'ADMIN',
    },
    create: {
      name: 'Administrador',
      email: 'admin@email.com',
      cpf: '44444444444',
      role: 'ADMIN',
      passwordHash: e2ePasswordHash,
      club: 'Clube E2E',
    },
  });

  console.log('Seed concluído com sucesso!');
  console.log({
    admin: { id: admin.id, name: admin.name, email: admin.email, cpf: admin.cpf, role: admin.role },
    annotator: { id: annotator.id, name: annotator.name, email: annotator.email, cpf: annotator.cpf, role: annotator.role },
    e2eUsers: [athlete1.email, athlete2.email, coach.email, adminE2E.email],
    players: [p1.name, p2.name, athlete1.name, athlete2.name],
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
