import type { MatchPlayerPayload } from './match-card-types';

export function checkPlayerOwnClub(
  p1: MatchPlayerPayload,
  p1Partner: MatchPlayerPayload | null | undefined,
  activeCtId: string | null | undefined,
  activeCtName: string | null | undefined,
  matchCtId: string | null | undefined,
): boolean {
  if (!activeCtId || activeCtId === 'PARTICULAR') return false;

  const testPlayer = (p?: MatchPlayerPayload | null) => {
    if (!p) return false;
    if (p.playerCts?.some((pc) => pc.ctId === activeCtId)) return true;
    if (p.clubId && p.clubId === activeCtId) return true;
    if (p.club && (p.club === activeCtId || (activeCtName && p.club.trim().toLowerCase() === activeCtName.trim().toLowerCase()))) {
      return true;
    }
    if (matchCtId && matchCtId === activeCtId && (!p.club || (activeCtName && p.club.trim().toLowerCase() === activeCtName.trim().toLowerCase()))) {
      return true;
    }
    return false;
  };

  return testPlayer(p1) || testPlayer(p1Partner);
}

export function checkPlayerOwnCoach(
  p1: MatchPlayerPayload,
  p1Partner: MatchPlayerPayload | null | undefined,
  userId: string | null | undefined,
  followedPlayerIds: readonly string[] | string[] | null | undefined,
  activeCtId: string | null | undefined,
): boolean {
  const isParticular = activeCtId === 'PARTICULAR' || !activeCtId;
  if (!isParticular) return false;

  const testPlayer = (p?: MatchPlayerPayload | null) => {
    if (!p) return false;
    if (userId && p.createdByUserId === userId) return true;
    if (p.id && followedPlayerIds && followedPlayerIds.includes(p.id)) return true;
    return false;
  };

  return testPlayer(p1) || testPlayer(p1Partner);
}

export function determineWinner(
  isFinished: boolean,
  match: { winnerId?: string | null; player1: { id?: string }; player2: { id?: string }; player1Partner?: { id?: string } | null; player2Partner?: { id?: string } | null },
  setsWonP1: number,
  setsWonP2: number,
  isCurrentSetMT: boolean,
  displayedSets: Array<{ player1: number; player2: number }>,
): { isWinnerP1: boolean; isWinnerP2: boolean } {
  if (!isFinished) return { isWinnerP1: false, isWinnerP2: false };

  const isWinnerP1 =
    Boolean(match.winnerId && (match.winnerId === match.player1.id || match.winnerId === match.player1Partner?.id)) ||
    setsWonP1 > setsWonP2 ||
    (isCurrentSetMT && (displayedSets[0]?.player1 ?? 0) > (displayedSets[0]?.player2 ?? 0));

  const isWinnerP2 =
    Boolean(match.winnerId && (match.winnerId === match.player2.id || match.winnerId === match.player2Partner?.id)) ||
    setsWonP2 > setsWonP1 ||
    (isCurrentSetMT && (displayedSets[0]?.player2 ?? 0) > (displayedSets[0]?.player1 ?? 0));

  return { isWinnerP1, isWinnerP2 };
}