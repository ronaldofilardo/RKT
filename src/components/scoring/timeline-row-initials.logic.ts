import { getPlayerInitials, getTeamInitials, type TimelineDoublesConfig } from './timeline-row.logic';

interface ServerInitialsParams {
  serverNumber: number;
  pointServerId?: string | null;
  player1Name: string;
  player2Name: string;
  doubles?: TimelineDoublesConfig;
}

export function resolveServerInitials({
  serverNumber,
  pointServerId,
  player1Name,
  player2Name,
  doubles,
}: ServerInitialsParams): string {
  const fallback = getPlayerInitials(serverNumber === 1 ? player1Name : player2Name);

  if (!doubles || !pointServerId) return fallback;

  if (pointServerId === doubles.player1Id) {
    return getPlayerInitials(player1Name);
  }
  if (pointServerId === doubles.player1PartnerId && doubles.player1PartnerName) {
    return getPlayerInitials(doubles.player1PartnerName);
  }
  if (pointServerId === doubles.player2Id) {
    return getPlayerInitials(player2Name);
  }
  if (pointServerId === doubles.player2PartnerId && doubles.player2PartnerName) {
    return getPlayerInitials(doubles.player2PartnerName);
  }
  return fallback;
}

interface WinnerInitialsParams {
  winnerNumber: number;
  player1Name: string;
  player2Name: string;
  doubles?: TimelineDoublesConfig;
}

export function resolveWinnerInitials({
  winnerNumber,
  player1Name,
  player2Name,
  doubles,
}: WinnerInitialsParams): string {
  if (!doubles) return getPlayerInitials(winnerNumber === 1 ? player1Name : player2Name);

  return winnerNumber === 1
    ? getTeamInitials(player1Name, doubles.player1PartnerName)
    : getTeamInitials(player2Name, doubles.player2PartnerName);
}
