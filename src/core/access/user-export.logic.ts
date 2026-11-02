import { prisma } from '@/lib/prisma';

export interface ExportMatchHistory {
  matchId: string;
  opponentName: string;
  opponentId?: string | null;
  result: 'WIN' | 'LOSS' | 'DRAW' | null;
  score?: string | null;
  date?: string | null;
}

export interface UserExportData {
  user: { id: string; email: string | null; name: string | null; role: string; club: string | null; isActive: boolean; canOperate: boolean; createdAt: string; updatedAt: string };
  player: { id: string; name: string | null; club: string | null; ranking: number | null; birthDate: string | null } | null;
  matchHistory: ExportMatchHistory[];
}

export async function exportUserData(userId: string): Promise<UserExportData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, club: true, isActive: true, canOperate: true, createdAt: true, updatedAt: true },
  });
  if (!user) throw new Error('USER_NOT_FOUND');

  const player = await prisma.player.findUnique({ where: { userId }, select: { id: true, name: true, club: true, ranking: true, birthDate: true } });

  const matches = await prisma.match.findMany({
    where: { OR: [{ player1Id: userId }, { player2Id: userId }, { player1PartnerId: userId }, { player2PartnerId: userId }] },
    select: { id: true, finishedAt: true, scoreState: true, winnerId: true, player1: { select: { id: true, name: true } }, player2: { select: { id: true, name: true } }, player1Partner: { select: { id: true, name: true } }, player2Partner: { select: { id: true, name: true } } },
  });

  const matchHistory: ExportMatchHistory[] = [];
  for (const m of matches) {
    const opp = [m.player1, m.player2, m.player1Partner, m.player2Partner].filter((p): p is { id: string; name: string } => p != null && p.id !== userId)[0];
    if (!opp) continue;
    matchHistory.push({ matchId: m.id, opponentName: opp.name, opponentId: opp.id, result: m.winnerId === userId ? 'WIN' : m.winnerId ? 'LOSS' : null, score: typeof m.scoreState === 'string' ? m.scoreState : null, date: m.finishedAt ? new Date(m.finishedAt).toISOString() : null });
  }

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role, club: user.club, isActive: user.isActive, canOperate: user.canOperate, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() },
    player: player ? { id: player.id, name: player.name, club: player.club, ranking: player.ranking, birthDate: player.birthDate ? new Date(player.birthDate).toISOString() : null } : null,
    matchHistory,
  };
}
