import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { createGuardianTutelaBundle, GuardianSignupError } from './signup-guardian-tutela.logic';
import { respondGuardianSignup } from './signup-session.logic';
import type { SignupInput } from './signup-post.logic';

export interface GuardianSignupDeps {
  input: SignupInput;
  email: string | null;
  cpfValue: string;
  passwordHash: string;
  ipHash: string;
}

/**
 * A0.21 (Fase 1): cadastro atômico do responsável legal — `User` + `Player` +
 * `GuardianLink` + `ConsentRecord` numa única transação, com monotutela estrita.
 */
export async function registerGuardianSignup(deps: GuardianSignupDeps): Promise<NextResponse> {
  const { input, email, cpfValue, passwordHash, ipHash } = deps;
  const profile = input.guardianProfile;
  if (!profile) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Dados do responsável ausentes.' }, { status: 400 });
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: email ?? `${cpfValue}@local`,
          cpf: cpfValue,
          passwordHash,
          canOperate: profile.accessMode === 'SPECTATOR',
          role: 'ANNOTATOR',
        },
      });
      const { playerId } = await createGuardianTutelaBundle(tx, {
        guardianUserId: user.id,
        profile,
        ipHash,
        origem: input.origem ?? null,
      });
      return { user, playerId };
    });

    return await respondGuardianSignup(
      { id: created.user.id, name: created.user.name, sessionVersion: created.user.sessionVersion },
      { accessMode: profile.accessMode, playerId: created.playerId },
    );
  } catch (error) {
    if (error instanceof GuardianSignupError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'CONFLICT', message: 'Conta já existe' }, { status: 409 });
    }
    logger.error('[SIGNUP GUARDIAN POST]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
