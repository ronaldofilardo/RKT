import type { Prisma } from '@prisma/client';
import { hashCpf } from '@/core/athlete/cpf';
import type { GuardianProfileInput } from '@/schemas/guardian';
import { recordGuardianConsents } from './signup-guardian-consent.logic';

const PEPPER = process.env.CPF_HASH_PEPPER ?? '';

type Tx = Prisma.TransactionClient;

/** Falha de domínio do cadastro de responsável (ex.: monotutela violada → 409). */
export class GuardianSignupError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
    this.name = 'GuardianSignupError';
  }
}

/** Localiza o menor por CPF+nascimento (ou pelo mesmo responsável já cadastrante) ou cria o registro. */
async function resolveMinorPlayer(
  tx: Tx,
  guardianUserId: string,
  profile: GuardianProfileInput,
  birthDate: Date,
): Promise<string> {
  const cpf = profile.minorCpf;
  const cpfHash = cpf ? hashCpf(cpf, PEPPER) : null;
  const match: Prisma.PlayerWhereInput = {
    birthDate,
    userId: null,
    ...(cpfHash ? { cpfHash } : { name: profile.minorName, createdByUserId: guardianUserId }),
  };
  const existing = await tx.player.findFirst({ where: match, select: { id: true } });
  if (existing) return existing.id;

  const created = await tx.player.create({
    data: {
      name: profile.minorName,
      birthDate,
      createdByUserId: guardianUserId,
      identityStatus: 'CONFIRMED',
      ...(cpf ? { cpf, cpfHash, cpfLast2: cpf.slice(-2) } : {}),
    },
    select: { id: true },
  });
  return created.id;
}

export interface GuardianBundleInput {
  guardianUserId: string;
  profile: GuardianProfileInput;
  ipHash: string;
  origem: string | null;
}

/** Cria Player + GuardianLink + consentimentos do menor, com monotutela estrita (1 ativo por menor). */
export async function createGuardianTutelaBundle(
  tx: Tx,
  input: GuardianBundleInput,
): Promise<{ playerId: string }> {
  const { guardianUserId, profile, ipHash, origem } = input;
  const birthDate = new Date(profile.minorBirthDate);
  const playerId = await resolveMinorPlayer(tx, guardianUserId, profile, birthDate);

  const active = await tx.guardianLink.findFirst({
    where: { playerId, status: 'ACTIVE', revokedAt: null },
    select: { id: true },
  });
  if (active) {
    throw new GuardianSignupError(409, 'MONOTUTELA_CONFLICT', 'Este menor já possui um responsável legal ativo.');
  }

  const now = new Date();
  await tx.guardianLink.create({
    data: {
      guardianUserId,
      playerId,
      relation: profile.relationship,
      status: 'ACTIVE',
      confirmedAt: now,
      verificationLevel: 'N1_CADASTRO_FAMILIAR',
    },
  });
  await recordGuardianConsents(tx, { guardianUserId, playerId, profile, ipHash, origem, now });
  return { playerId };
}
