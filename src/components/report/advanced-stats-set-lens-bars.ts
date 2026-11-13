import type { AdvancedMatchStats, SetBreakdown } from '@/core/report/compute-stats';

// ===========================================================================
// SET LENS — dados das barras comparativas (head-to-head do set ativo)
// ===========================================================================

export interface ComparativeBarData {
  label: string;
  p1Val: string;
  p2Val: string;
  p1Num: number;
  p2Num: number;
  tone?: 'default' | 'error';
}

export function buildComparativeBars(
  sb: SetBreakdown,
  fs: AdvancedMatchStats | null,
): ComparativeBarData[] {
  const rows: ComparativeBarData[] = [
    {
      label: 'Games Ganhos',
      p1Val: String(sb.p1Games),
      p2Val: String(sb.p2Games),
      p1Num: sb.p1Games,
      p2Num: sb.p2Games,
    },
    {
      label: 'Pontos Totais',
      p1Val: String(sb.p1Points),
      p2Val: String(sb.p2Points),
      p1Num: sb.p1Points,
      p2Num: sb.p2Points,
    },
    {
      label: 'Winners',
      p1Val: String(sb.p1Winners),
      p2Val: String(sb.p2Winners),
      p1Num: sb.p1Winners,
      p2Num: sb.p2Winners,
    },
    {
      label: 'Erros (ENF + EF)',
      p1Val: String(sb.p1Errors),
      p2Val: String(sb.p2Errors),
      p1Num: sb.p1Errors,
      p2Num: sb.p2Errors,
      tone: 'error',
    },
    {
      label: 'Aces',
      p1Val: String(sb.p1Aces),
      p2Val: String(sb.p2Aces),
      p1Num: sb.p1Aces,
      p2Num: sb.p2Aces,
    },
  ];

  if (fs) {
    const s1 = fs.serve.player1;
    const s2 = fs.serve.player2;
    const r1 = fs.returnStats.player1;
    const r2 = fs.returnStats.player2;

    rows.push(
      {
        label: '1º Saque em Quadra',
        p1Val: `${s1.firstServePct.toFixed(1)}%`,
        p2Val: `${s2.firstServePct.toFixed(1)}%`,
        p1Num: s1.firstServePct,
        p2Num: s2.firstServePct,
      },
      {
        label: 'Pontos no 1º Saque',
        p1Val: `${s1.firstServePointsWonPct.toFixed(1)}%`,
        p2Val: `${s2.firstServePointsWonPct.toFixed(1)}%`,
        p1Num: s1.firstServePointsWonPct,
        p2Num: s2.firstServePointsWonPct,
      },
      {
        label: 'Pontos na Devolução',
        p1Val: `${r1.firstServeReturnPointsWonPct.toFixed(1)}%`,
        p2Val: `${r2.firstServeReturnPointsWonPct.toFixed(1)}%`,
        p1Num: r1.firstServeReturnPointsWonPct,
        p2Num: r2.firstServeReturnPointsWonPct,
      },
      {
        label: 'Break Points Salvos',
        p1Val: `${s1.breakPointsSavedPct.toFixed(1)}%`,
        p2Val: `${s2.breakPointsSavedPct.toFixed(1)}%`,
        p1Num: s1.breakPointsSavedPct,
        p2Num: s2.breakPointsSavedPct,
      }
    );
  }

  return rows;
}
