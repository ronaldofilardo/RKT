import type { Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import type { StaffIndicationInput } from '@/schemas/guardian';

type Tx = Prisma.TransactionClient;

const INVITE_TTL_DAYS = 7;

export type StaffIndicateResult =
  | { kind: 'CT' | 'COACH'; id: string; status: string }
  | { kind: 'EXTERNAL_COACH'; inviteId: string; inviteUrl: string };

export interface StaffIndicateInput {
  guardianUserId: string;
  playerId: string;
  indication: StaffIndicationInput;
}

/** URL pública do convite (token só é válido após persistido em `coach_invitation_tokens`). */
export function coachInviteUrl(token: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
  return `${base}/signup?perfil=TREINADOR&convite=${encodeURIComponent(token)}`;
}

/**
 * Indicação de equipe técnica pelo responsável: cria vínculo em `PENDING`
 * (nunca rebaixa vínculo ativo) ou emite convite assinado para treinador externo.
 */
export async function indicateStaff(tx: Tx, input: StaffIndicateInput): Promise<StaffIndicateResult> {
  const { guardianUserId, playerId, indication } = input;
  const targetId = indication.targetId;

  if (indication.kind === 'CT' && targetId) return pendingCtLink(tx, playerId, targetId);
  if (indication.kind === 'COACH' && targetId) return pendingCoachLink(tx, targetId, playerId);
  return issueCoachInvite(tx, { guardianUserId, playerId, indication });
}

async function pendingCtLink(tx: Tx, playerId: string, ctId: string): Promise<StaffIndicateResult> {
  const existing = await tx.playerCT.findUnique({
    where: { playerId_ctId: { playerId, ctId } },
    select: { id: true, status: true },
  });
  if (existing) return { kind: 'CT', id: existing.id, status: existing.status };
  const created = await tx.playerCT.create({ data: { playerId, ctId, status: 'PENDING' }, select: { id: true } });
  return { kind: 'CT', id: created.id, status: 'PENDING' };
}

async function pendingCoachLink(tx: Tx, coachUserId: string, playerId: string): Promise<StaffIndicateResult> {
  const key = { coachUserId_playerId: { coachUserId, playerId } };
  const existing = await tx.coachAthleteLink.findUnique({ where: key, select: { id: true, status: true } });
  if (existing && !['REJECTED', 'ENDED'].includes(existing.status)) {
    return { kind: 'COACH', id: existing.id, status: existing.status };
  }
  const link = await tx.coachAthleteLink.upsert({
    where: key,
    create: { coachUserId, playerId, status: 'PENDING' },
    update: { status: 'PENDING', respondedAt: null, endedAt: null },
    select: { id: true },
  });
  return { kind: 'COACH', id: link.id, status: 'PENDING' };
}

async function issueCoachInvite(
  tx: Tx,
  input: { guardianUserId: string; playerId: string; indication: StaffIndicationInput },
): Promise<StaffIndicateResult> {
  const { guardianUserId, playerId, indication } = input;
  const token = randomBytes(32).toString('base64url');
  const invite = await tx.coachInvitationToken.create({
    data: {
      guardianUserId,
      playerId,
      coachName: indication.coachName ?? null,
      coachPhone: indication.coachPhone ?? null,
      tokenHash: createHash('sha256').update(token).digest('hex'),
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000),
    },
    select: { id: true },
  });
  return { kind: 'EXTERNAL_COACH', inviteId: invite.id, inviteUrl: coachInviteUrl(token) };
}
