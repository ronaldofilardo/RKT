import { prisma } from '@/lib/prisma';
import { hashSpectateToken } from '@/lib/spectate-token';
import { isMinor } from '@/core/access/age';
import { maskNameForMinor } from '@/core/access/pool';

const ACCESS_WINDOW_DAYS = 7;

function getDisplayName(name: string, birthDate?: Date | string | null, now = new Date()): string {
  if (isMinor(birthDate ? new Date(birthDate) : null, now)) {
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) return `${parts[0]} ${parts[parts.length - 1][0]}.`;
    return maskNameForMinor(name);
  }
  return name;
}

export async function getInvitePreview(token: string) {
  const tokenHash = hashSpectateToken(token);
  const link = await prisma.matchShareLink.findUnique({
    where: { tokenHash },
    include: {
      createdByUser: { select: { name: true } },
      match: {
        select: {
          id: true,
          state: true,
          format: true,
          courtType: true,
          deletedAt: true,
          finishedAt: true,
          scoreState: true,
          player1: { select: { id: true, name: true, birthDate: true } },
          player2: { select: { id: true, name: true, birthDate: true } },
        },
      },
    },
  });

  if (!link || link.revokedAt || link.match.deletedAt || link.match.state === 'CANCELLED') {
    return { ok: false as const, error: 'INVITE_INVALID', status: 404 };
  }

  if (link.match.state === 'FINISHED' && link.match.finishedAt) {
    const expiresAt = new Date(link.match.finishedAt).getTime() + ACCESS_WINDOW_DAYS * 86_400_000;
    if (Date.now() > expiresAt) {
      return { ok: false as const, error: 'ACCESS_EXPIRED', status: 410 };
    }
  }

  const now = new Date();
  const p1Name = getDisplayName(link.match.player1.name, link.match.player1.birthDate, now);
  const p2Name = getDisplayName(link.match.player2.name, link.match.player2.birthDate, now);
  const matchTitle = `${p1Name} × ${p2Name}`;

  const score = (link.match.scoreState as any) || {};
  const currentSetNum = Array.isArray(score.sets) ? Math.min(score.sets.length + 1, 5) : 1;
  const courtName = link.match.courtType ? `Quadra ${link.match.courtType}` : 'Quadra 1';
  const courtAndSet = `${courtName} · ${currentSetNum}º set`;

  const inviterName = link.createdByUser?.name || link.label || 'O organizador';
  const status = link.match.state === 'FINISHED' ? 'Encerrada' : 'Ao vivo';

  return {
    ok: true as const,
    matchId: link.matchId,
    inviterName,
    matchTitle,
    courtAndSet,
    status,
  };
}

