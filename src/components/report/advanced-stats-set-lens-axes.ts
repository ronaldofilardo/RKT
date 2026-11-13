import type { AdvancedMatchStats } from '@/core/report/compute-stats';

// ===========================================================================
// SET LENS — eixos do mini-radar (a partir de stats ricas do set)
// ===========================================================================

export interface RadarAxisData {
  label: string;
  sublabel: string;
  p1: number;
  p2: number;
}

export function computeSetRadarAxes(setStats: AdvancedMatchStats): RadarAxisData[] {
  const { serve, returnStats, shots } = setStats;
  const s1 = serve.player1;
  const s2 = serve.player2;
  const r1 = returnStats.player1;
  const r2 = returnStats.player2;
  const sh1 = shots.player1;
  const sh2 = shots.player2;

  const totalSh1 = sh1.winners + sh1.forcedErrors + sh1.unforcedErrors || 1;
  const totalSh2 = sh2.winners + sh2.forcedErrors + sh2.unforcedErrors || 1;
  const prec1 = Math.max(0, Math.min(100, 100 - (sh1.unforcedErrors / totalSh1) * 100));
  const prec2 = Math.max(0, Math.min(100, 100 - (sh2.unforcedErrors / totalSh2) * 100));

  const maxW = Math.max(sh1.winners, sh2.winners, 1);

  return [
    {
      label: '1º Saque',
      sublabel: '% em quadra',
      p1: Math.min(100, s1.firstServePct),
      p2: Math.min(100, s2.firstServePct),
    },
    {
      label: 'Efic. Saque',
      sublabel: '% pts 1º S',
      p1: Math.min(100, s1.firstServePointsWonPct),
      p2: Math.min(100, s2.firstServePointsWonPct),
    },
    {
      label: 'Winners',
      sublabel: 'relativo',
      p1: (sh1.winners / maxW) * 100,
      p2: (sh2.winners / maxW) * 100,
    },
    {
      label: 'Precisão',
      sublabel: '% sem ENF',
      p1: prec1,
      p2: prec2,
    },
    {
      label: 'Devolução',
      sublabel: '% pts dev',
      p1: Math.min(100, (r1.firstServeReturnPointsWonPct + r1.secondServeReturnPointsWonPct) / 2),
      p2: Math.min(100, (r2.firstServeReturnPointsWonPct + r2.secondServeReturnPointsWonPct) / 2),
    },
    {
      label: 'Def. Break',
      sublabel: '% BP salvos',
      p1: Math.min(100, s1.breakPointsSavedPct),
      p2: Math.min(100, s2.breakPointsSavedPct),
    },
  ];
}
