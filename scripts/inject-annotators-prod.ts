import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Garante o carregamento das credenciais de produção
dotenv.config({ path: '.env.production', override: true });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

interface AnnotatorInput {
  name: string;
  cpfRaw: string;
  birthDate: string; // ddmmaaaa
  email: string;
}

const annotatorsToInject: AnnotatorInput[] = [
  {
    name: 'Guilherme Igeski Stencel',
    cpfRaw: '13996598980',
    birthDate: '05112007',
    email: 'guilherme.stencel@rkt.com',
  },
  {
    name: 'Ingryd Waltrich',
    cpfRaw: '08117254999',
    birthDate: '26082006',
    email: 'ingryd.waltrich@rkt.com',
  },
  {
    name: 'Kauann Belasque Sai',
    cpfRaw: '087.737.599-29',
    birthDate: '01041997',
    email: 'kauann.sai@rkt.com',
  },
  {
    name: 'Hiroshi Kajiwara',
    cpfRaw: '077.101.669-70',
    birthDate: '08031989',
    email: 'hiroshi.kajiwara@rkt.com',
  },
  {
    name: 'Fabrycio Waltrich',
    cpfRaw: '081.172.489-13',
    birthDate: '14102003',
    email: 'fabrycio.waltrich@rkt.com',
  },
  {
    name: 'Pedro Chemin de Moraes',
    cpfRaw: '08346677979',
    birthDate: '23052008',
    email: 'pedro.moraes@rkt.com',
  },
  {
    name: 'Gabriel de Oliveira Alvares',
    cpfRaw: '461.189.978-02',
    birthDate: '23041998',
    email: 'gabriel.alvares@rkt.com',
  },
];

async function main() {
  console.log('--- INJEÇÃO DE ANOTADORES NO BANCO DE PRODUÇÃO ---');
  const targetHost = process.env.DATABASE_URL?.split('@')[1]?.split('/')[0];
  console.log(`Alvo: ${targetHost}\n`);

  for (const item of annotatorsToInject) {
    const cleanCpf = item.cpfRaw.replace(/\D/g, '');
    const plainPassword = item.birthDate.trim();
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const user = await prisma.user.upsert({
      where: { cpf: cleanCpf },
      update: {
        name: item.name,
        email: item.email,
        passwordHash,
        role: Role.ANNOTATOR,
        isActive: true,
      },
      create: {
        name: item.name,
        email: item.email,
        cpf: cleanCpf,
        passwordHash,
        role: Role.ANNOTATOR,
        isActive: true,
      },
    });

    // Verificação de autenticação imediata
    const passwordOk = await bcrypt.compare(plainPassword, user.passwordHash);

    console.log(`✔ [${user.role}] ${user.name}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   CPF: ${user.cpf}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Senha (ddmmaaaa): ${plainPassword}`);
    console.log(`   Hash Válido: ${passwordOk ? 'SIM' : 'NÃO'}\n`);
  }

  const total = await prisma.user.count({ where: { role: Role.ANNOTATOR } });
  console.log(`Total de anotadores no banco: ${total}`);
}

main()
  .catch((err) => {
    console.error('Falha na injeção:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
