import type { SetBreakdown } from '@/core/report/compute-stats';
import type { RadarAxisData } from './advanced-stats-set-lens-axes';

// ===========================================================================
// SET LENS — eixos do mini-radar via fallback (SetBreakdown) e vencedor do set
// ===========================================================================

export function computeSetRadarAxesFromBreakdown(sb: SetBreakdown): RadarAxisData[] {
  const maxW = Math.max(sb.p1Winners, sb.p2Winners, 1);
  const prec1 = Math.max(0, Math.min(100, 100 - (sb.p1Errors / Math.max(sb.p1Points, 1)) * 100));
  const prec2 = Math.max(0, Math.min(100, 100 - (sb.p2Errors / Math.max(sb.p2Points, 1)) * 100));
  const totalPts = sb.p1Points + sb.p2Points || 1;

  return [
    {
      label: 'Games',
      sublabel: 'eficiência',
      p1: (sb.p1Games / Math.max(sb.p1Games + sb.p2Games, 1)) * 100,
      p2: (sb.p2Games / Math.max(sb.p1Games + sb.p2Games, 1)) * 100,
    },
    {
      label: 'Pontos',
      sublabel: '% do set',
      p1: (sb.p1Points / totalPts) * 100,
      p2: (sb.p2Points / totalPts) * 100,
    },
    {
      label: 'Winners',
      sublabel: 'relativo',
      p1: (sb.p1Winners / maxW) * 100,
      p2: (sb.p2Winners / maxW) * 100,
    },
    {
      label: 'Precisão',
      sublabel: '% sem erros',
      p1: prec1,
      p2: prec2,
    },
    {
      label: 'Aces',
      sublabel: 'volume',
      p1: (sb.p1Aces / Math.max(sb.p1Aces, sb.p2Aces, 1)) * 100,
      p2: (sb.p2Aces / Math.max(sb.p1Aces, sb.p2Aces, 1)) * 100,
    },
    {
      label: 'Domínio',
      sublabel: 'ritmo geral',
      p1: sb.p1Games > sb.p2Games ? 85 : 45,
      p2: sb.p2Games > sb.p1Games ? 85 : 45,
    },
  ];
}

/** Identificação do vencedor do set (placar de games + tiebreak + fallback em pontos). */
export function computeSetWinnerInfo(
  sb: SetBreakdown,
  player1Name: string,
  player2Name: string,
  p1Hex: string,
  p2Hex: string,
) {
  const p1Score = sb.p1Games;
  const p2Score = sb.p2Games;
  let winner: 'p1' | 'p2' | null = null;

  if (p1Score > p2Score) {
    winner = 'p1';
  } else if (p2Score > p1Score) {
    winner = 'p2';
  } else if (sb.isTiebreak) {
    if ((sb.tiebreakP1 ?? 0) > (sb.tiebreakP2 ?? 0)) winner = 'p1';
    else if ((sb.tiebreakP2 ?? 0) > (sb.tiebreakP1 ?? 0)) winner = 'p2';
  } else if (sb.p1Points > sb.p2Points) {
    winner = 'p1';
  } else if (sb.p2Points > sb.p1Points) {
    winner = 'p2';
  }

  const winnerName = winner === 'p1' ? player1Name : winner === 'p2' ? player2Name : null;
  const winnerColorHex = winner === 'p1' ? p1Hex : p2Hex;
  const scoreText = sb.isTiebreak && sb.tiebreakP1 != null && sb.tiebreakP2 != null
    ? `${p1Score}x${p2Score} (${sb.tiebreakP1}-${sb.tiebreakP2})`
    : `${p1Score}x${p2Score}`;

  return { winner, winnerName, winnerColorHex, scoreText };
}
