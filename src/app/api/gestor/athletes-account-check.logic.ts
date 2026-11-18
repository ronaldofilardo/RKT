import { prisma } from '@/lib/prisma';
import { isMinor } from '@/core/access/age';
import { cleanCpf, hashCpf } from '@/core/athlete/cpf';
import type { AccountCheckResult } from './athletes-account-check.types';

export async function checkAthleteExistingAccount(rawCpf: string): Promise<AccountCheckResult> {
  const normalizedCpf = cleanCpf(rawCpf);
  if (!normalizedCpf) return { kind: 'NONE', name: '', message: '', canLink: false, statusToApply: 'ACTIVE' };

  const existingUser = await prisma.user.findUnique({
    where: { cpf: normalizedCpf },
    include: { guardianLinks: { where: { status: 'ACTIVE', revokedAt: null } } },
  });

  if (existingUser) {
    if (existingUser.guardianLinks && existingUser.guardianLinks.length > 0) {
      return {
        kind: 'GUARDIAN_USER', existingUserId: existingUser.id, name: existingUser.name,
        message: `Este CPF pertence ao Responsável Legal ${existingUser.name}. Para cadastrar o atleta menor, insira o CPF do dependente.`,
        canLink: false, statusToApply: 'PENDING',
      };
    }

    const player = await prisma.player.findFirst({
      where: { userId: existingUser.id },
      include: {
        guardianLinks: {
          where: { status: 'ACTIVE', revokedAt: null },
          include: { guardian: { select: { name: true } } },
        },
      },
    });

    const minor = player?.birthDate ? isMinor(player.birthDate, new Date()) : false;
    const activeGuardian = player?.guardianLinks?.[0];

    if (minor || activeGuardian) {
      const gName = activeGuardian?.guardian?.name ?? 'Responsável Legal';
      return {
        kind: 'MINOR_WITH_GUARDIAN', existingUserId: existingUser.id, existingPlayerId: player?.id,
        name: existingUser.name, guardianName: gName,
        message: `Atleta menor de idade (${existingUser.name}) sob tutela de ${gName}. O vínculo com o clube ficará pendente de aprovação do responsável.`,
        canLink: true, statusToApply: 'PENDING',
      };
    }

    return {
      kind: 'ADULT_ATHLETE', existingUserId: existingUser.id, existingPlayerId: player?.id,
      name: existingUser.name, message: `Atleta ${existingUser.name} encontrado no RKT. Deseja adicionar o atleta ao elenco do clube?`,
      canLink: true, statusToApply: 'ACTIVE',
    };
  }

  const pepper = process.env.CPF_HASH_PEPPER ?? '';
  const cpfHash = hashCpf(normalizedCpf, pepper);
  const dependentPlayer = await prisma.player.findFirst({
    where: { OR: [{ cpf: normalizedCpf }, { cpfHash }], userId: null },
    include: {
      guardianLinks: {
        where: { status: 'ACTIVE', revokedAt: null },
        include: { guardian: { select: { name: true } } },
      },
    },
  });

  if (dependentPlayer) {
    const guardian = dependentPlayer.guardianLinks?.[0];
    const gName = guardian?.guardian?.name ?? 'Responsável Legal';
    return {
      kind: 'DEPENDENT_PLAYER_WITHOUT_USER', existingPlayerId: dependentPlayer.id,
      name: dependentPlayer.name, guardianName: gName,
      message: `Atleta dependente (${dependentPlayer.name}) sob tutela de ${gName}. Deseja solicitar vínculo do atleta ao seu clube?`,
      canLink: true, statusToApply: 'PENDING',
    };
  }

  return { kind: 'NONE', name: '', message: '', canLink: false, statusToApply: 'ACTIVE' };
}
