import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';
import { isMinor } from '@/core/access/age';

export async function POST(request: NextRequest) {
  const user = await getAccessUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const player = await prisma.player.findFirst({ where: { userId: user.id } });
  if (!player) return NextResponse.json({ error: 'PLAYER_NOT_FOUND' }, { status: 404 });

  if (!isMinor(player.birthDate, new Date())) {
    return NextResponse.json({ error: 'NOT_A_MINOR', message: 'Atleta maior de 18 anos não requer responsável legal.' }, { status: 400 });
  }

  const activeLink = await prisma.guardianLink.findFirst({
    where: { playerId: player.id, status: 'ACTIVE', revokedAt: null },
  });
  if (activeLink) {
    return NextResponse.json({
      error: 'MONOTUTELA_CONFLICT',
      message: 'Você já possui um responsável legal vinculado à sua conta.',
    }, { status: 409 });
  }

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const count24h = await prisma.guardianInvite.count({
    where: { playerId: player.id, createdAt: { gte: since24h } },
  });
  if (count24h >= 3) {
    return NextResponse.json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Limite de 3 convites diários atingido. Reenvie o convite anterior ou tente novamente amanhã.',
    }, { status: 429 });
  }

  await prisma.guardianInvite.updateMany({
    where: { playerId: player.id, usedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const token = randomBytes(24).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = createHash('sha256').update(code).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.guardianInvite.create({
    data: {
      playerId: player.id, createdByUserId: user.id, createdByKind: 'MENOR',
      tokenHash, codeHash, expiresAt,
    },
  });

  return NextResponse.json({
    ok: true,
    token,
    expiresAt,
    warning: 'Atenção: Apenas 1 responsável legal pode ser cadastrado. Envie este convite para seu pai, mãe ou tutor legal.',
  }, { status: 201 });
}
