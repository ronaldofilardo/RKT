import type { Prisma } from '@prisma/client';
import { CURRENT_TERMS_VERSION, GUARDIAN_TERMS_VERSION } from '@/core/access';
import type { GuardianProfileInput } from '@/schemas/guardian';

type Tx = Prisma.TransactionClient;

interface ConsentBundleInput {
  guardianUserId: string;
  playerId: string;
  profile: GuardianProfileInput;
  ipHash: string;
  origem: string | null;
  now: Date;
}

/**
 * Tríade de consentimentos do menor (LGPD Art. 14 / ECA Digital):
 * `ConsentRecord` imutável + `ConsentEvent` auditável + trilha de auditoria do vínculo.
 */
export async function recordGuardianConsents(tx: Tx, input: ConsentBundleInput): Promise<void> {
  const { guardianUserId, playerId, profile, ipHash, origem, now } = input;
  const verificationLevel = 'N1_CADASTRO_FAMILIAR';

  await tx.auditLog.create({
    data: {
      actorUserId: guardianUserId,
      action: 'TERMS_ACCEPTED',
      resourceType: 'User',
      resourceId: guardianUserId,
      meta: { termsVersion: CURRENT_TERMS_VERSION, origem },
      ipHash,
    },
  });

  const termsVersion = profile.termsVersion ?? GUARDIAN_TERMS_VERSION;
  const contentHash = profile.contentHash ?? 'v2.0-initial-hash';

  for (const purpose of profile.purposes) {
    await tx.consentRecord.create({
      data: { guardianUserId, playerId, purpose, termsVersion, grantedAt: now, ipHash },
    });
    await tx.consentEvent.create({
      data: {
        playerId,
        guardianUserId,
        purpose,
        action: 'GRANT',
        termsVersion,
        contentHash,
        ipHash,
        authMethod: 'SIGNUP',
        verificationLevel,
      },
    });
  }

  await tx.auditLog.create({
    data: {
      actorUserId: guardianUserId,
      action: 'GUARDIAN_SIGNUP_COMPLETED',
      resourceType: 'User',
      resourceId: guardianUserId,
      meta: {
        playerId,
        relationship: profile.relationship,
        purposes: profile.purposes,
        accessMode: profile.accessMode,
        declaration: profile.declaration ?? true,
        termsVersion,
        contentHash,
        origem,
      },
      ipHash,
    },
  });
}
