import type { AdvancedStatsSectionProps } from './advanced-stats-primitives';

// ---------------------------------------------------------------------------
// Radar de Desempenho — 6 eixos, SVG puro, zero dependências externas
// Usado em Estatística Avançada (ATP/WTA style performance radar)
// ---------------------------------------------------------------------------

// Mapeia as classes Tailwind do player-color.context para hex usável no SVG.
// Inclui variantes dark (padrão do RKT) e light.
export function tailwindClassToHex(cls: string): string {
  if (cls.includes('telemetry-volt')) return '#CCFF00'; // dark: neon volt
  if (cls.includes('emerald-800'))    return '#065f46'; // light: escuro
  // text-telemetry-text-primary → branco no dark, navy no light
  // Para o SVG sempre renderizamos no contexto dark, então #F8FAFC é seguro.
  return '#F8FAFC';
}

// Derivar fill com alpha a partir do hex
export function hexWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ---------------------------------------------------------------------------
// Axes
// ---------------------------------------------------------------------------
export interface RadarAxis {
  label: string;
  sublabel?: string;
  p1Value: number; // 0–100
  p2Value: number; // 0–100
}

export function computeAxes(stats: AdvancedStatsSectionProps['stats']): RadarAxis[] {
  const { serve, returnStats, shots } = stats;
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
      p1Value: Math.min(100, s1.firstServePct),
      p2Value: Math.min(100, s2.firstServePct),
    },
    {
      label: 'Efic. Saque',
      sublabel: '% pts ganhos 1º S',
      p1Value: Math.min(100, s1.firstServePointsWonPct),
      p2Value: Math.min(100, s2.firstServePointsWonPct),
    },
    {
      label: 'Winners',
      sublabel: 'relativo ao jogo',
      p1Value: (sh1.winners / maxW) * 100,
      p2Value: (sh2.winners / maxW) * 100,
    },
    {
      label: 'Precisão',
      sublabel: '% sem erros NF',
      p1Value: prec1,
      p2Value: prec2,
    },
    {
      label: 'Devolução',
      sublabel: '% pts ganhos dev',
      p1Value: Math.min(100, (r1.firstServeReturnPointsWonPct + r1.secondServeReturnPointsWonPct) / 2),
      p2Value: Math.min(100, (r2.firstServeReturnPointsWonPct + r2.secondServeReturnPointsWonPct) / 2),
    },
    {
      label: 'Def. Break',
      sublabel: '% BP defendidos',
      p1Value: Math.min(100, s1.breakPointsSavedPct),
      p2Value: Math.min(100, s2.breakPointsSavedPct),
    },
  ];
}
