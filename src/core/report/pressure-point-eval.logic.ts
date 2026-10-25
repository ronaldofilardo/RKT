import type { TimelinePoint, TennisFormat } from '@/core/scoring/types';

export function isNoAdFormat(format?: TennisFormat): boolean {
  return format === 'BEST_OF_3_NO_AD' || format === 'SHORT_SET_2V2_NO_AD';
}

export function isDecisivePoint(p: TimelinePoint, format?: TennisFormat): boolean {
  if (!isNoAdFormat(format)) return false;
  if (p.isTiebreak) return false;
  const p1 = p.gameScore?.player1 ?? 0;
  const p2 = p.gameScore?.player2 ?? 0;
  return p.gameIsDeuce || (p1 >= 3 && p2 >= 3 && p1 === p2);
}

export function isTimelineBreakPoint(p: TimelinePoint, playerIndex: 1 | 2, format?: TennisFormat): boolean {
  if (p.isTiebreak) return false;
  const serverIndex = p.server === 'player1' ? 1 : 2;
  const isReceiver = serverIndex !== playerIndex;
  if (!isReceiver) return false;

  if (isDecisivePoint(p, format)) {
    return true; // Item 1.15: Ponto decisivo é break point para o devolvedor
  }

  if (p.gameIsDeuce) {
    const receiverAdvantage = p.server === 'player1' ? 'player2' : 'player1';
    return p.gameAdvantage === receiverAdvantage;
  }

  const p1 = p.gameScore?.player1 ?? 0;
  const p2 = p.gameScore?.player2 ?? 0;
  const receiverPoints = playerIndex === 1 ? p1 : p2;
  const serverPoints = playerIndex === 1 ? p2 : p1;
  return receiverPoints >= 3 && serverPoints <= 2;
}

export function isTimelineGamePoint(p: TimelinePoint, playerIndex: 1 | 2, format?: TennisFormat): boolean {
  const p1 = p.gameScore?.player1 ?? 0;
  const p2 = p.gameScore?.player2 ?? 0;
  const playerPoints = playerIndex === 1 ? p1 : p2;
  const oppPoints = playerIndex === 1 ? p2 : p1;

  if (p.isTiebreak) {
    const isMatchTb = format === 'MATCH_TB_10' || (format === 'BEST_OF_3_MATCH_TB' && p.setNumber === 3);
    const target = isMatchTb ? 10 : 7;
    return playerPoints >= target - 1 && playerPoints - oppPoints >= 1;
  }

  if (isDecisivePoint(p, format)) {
    return true; // Item 1.15: Ponto Decisivo é game point para ambos
  }

  if (p.gameIsDeuce) {
    const playerSide = playerIndex === 1 ? 'player1' : 'player2';
    return p.gameAdvantage === playerSide;
  }

  return playerPoints >= 3 && oppPoints <= 2;
}

export function isTimelineSetPoint(p: TimelinePoint, playerIndex: 1 | 2, format?: TennisFormat): boolean {
  if (!isTimelineGamePoint(p, playerIndex, format)) return false;
  if (p.isTiebreak) return true;

  const p1Games = p.gamesScore?.player1 ?? 0;
  const p2Games = p.gamesScore?.player2 ?? 0;
  const playerGames = playerIndex === 1 ? p1Games : p2Games;
  const oppGames = playerIndex === 1 ? p2Games : p1Games;

  const gamesNeeded = format === 'PRO_SET_8' ? 8 : (format === 'SHORT_SET_2V2_NO_AD' ? 4 : 6);
  const tiebreakAt = gamesNeeded;
  const nextPlayerGames = playerGames + 1;

  return (
    (nextPlayerGames >= gamesNeeded && nextPlayerGames - oppGames >= 2) ||
    (nextPlayerGames === tiebreakAt + 1 && oppGames === tiebreakAt - 1)
  );
}
