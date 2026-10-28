/**
 * Script de provisionamento do primeiro usuário SUPORTE.
 * Executa via CLI/banco, sem depender de endpoints públicos.
 * Uso: pnpm tsx scripts/create-support-user.ts --email suporte@rkt.com --cpf 12345678901 --name "Suporte RKT" --password Senha@123
 */

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string): string | undefined => {
    const idx = args.findIndex((a) => a === `--${name}`);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const email = getArg('email');
  const cpf = getArg('cpf');
  const name = getArg('name');
  const password = getArg('password');

  if (!email || !cpf || !name || !password) {
    console.error('Uso: pnpm tsx scripts/create-support-user.ts --email <email> --cpf <cpf> --name <nome> --password <senha>');
    process.exit(1);
  }

  const normalizedCpf = cpf.replace(/\D/g, '');

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: email.toLowerCase() }, { cpf: normalizedCpf }] },
  });

  if (existing) {
    // Promover usuário existente para SUPORTE
    const membership = await prisma.membership.upsert({
      where: { userId_kind_ctId: { userId: existing.id, kind: 'PLATAFORMA', ctId: null } },
      update: { preset: 'SUPORTE', status: 'ACTIVE' },
      create: {
        userId: existing.id,
        kind: 'PLATAFORMA',
        preset: 'SUPORTE',
        ctId: null,
        status: 'ACTIVE',
      },
    });
    await prisma.user.update({
      where: { id: existing.id },
      data: { isActive: true, canOperate: true },
    });
    console.log(`Usuário existente promovido a SUPORTE: ${existing.id}`);
    console.log(`Membership: ${membership.id}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      cpf: normalizedCpf,
      passwordHash,
      role: 'ANNOTATOR',
      canOperate: true,
      isActive: true,
    },
  });

  await prisma.membership.create({
    data: {
      userId: user.id,
      kind: 'PLATAFORMA',
      preset: 'SUPORTE',
      ctId: null,
      status: 'ACTIVE',
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: 'SUPORTE_PROVISIONED',
      resourceType: 'User',
      resourceId: user.id,
      meta: { email: email.toLowerCase(), cpf: normalizedCpf },
    },
  });

  console.log(`Usuário SUPORTE criado: ${user.id}`);
  console.log(`E-mail: ${email}`);
  console.log(`CPF: ${normalizedCpf}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
