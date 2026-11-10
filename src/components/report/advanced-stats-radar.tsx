'use client';

import { useMemo } from 'react';
import { Section, type AdvancedStatsSectionProps } from './advanced-stats-primitives';
import { usePlayerColors } from '@/components/ui/player-color.context';

// ---------------------------------------------------------------------------
// Radar de Desempenho — 6 eixos, SVG puro, zero dependências externas
// Usado em Estatística Avançada (ATP/WTA style performance radar)
// ---------------------------------------------------------------------------

// Mapeia as classes Tailwind do player-color.context para hex usável no SVG.
// Inclui variantes dark (padrão do RKT) e light.
function tailwindClassToHex(cls: string): string {
  if (cls.includes('telemetry-volt')) return '#CCFF00'; // dark: neon volt
  if (cls.includes('emerald-800'))    return '#065f46'; // light: escuro
  // text-telemetry-text-primary → branco no dark, navy no light
  // Para o SVG sempre renderizamos no contexto dark, então #F8FAFC é seguro.
  return '#F8FAFC';
}

// Derivar fill com alpha a partir do hex
function hexWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ---------------------------------------------------------------------------
// Axes
// ---------------------------------------------------------------------------
interface RadarAxis {
  label: string;
  sublabel?: string;
  p1Value: number; // 0–100
  p2Value: number; // 0–100
}

function computeAxes(stats: AdvancedStatsSectionProps['stats']): RadarAxis[] {
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

// ---------------------------------------------------------------------------
// SVG radar geometry
// ---------------------------------------------------------------------------
const SIZE = 260;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 95;
const LEVELS = 4;

function polarToXY(angle: number, radius: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

function polygonPoints(values: number[], r: number) {
  return values
    .map((v, i) => {
      const { x, y } = polarToXY((360 / values.length) * i, (v / 100) * r);
      return `${x},${y}`;
    })
    .join(' ');
}

// ---------------------------------------------------------------------------
// Radar SVG — recebe as cores derivadas do contexto
// ---------------------------------------------------------------------------
interface RadarSVGProps {
  axes: RadarAxis[];
  p1Hex: string;
  p2Hex: string;
}

function RadarSVG({ axes, p1Hex, p2Hex }: RadarSVGProps) {
  const n = axes.length;
  const angles = axes.map((_, i) => (360 / n) * i);
  const levels = Array.from({ length: LEVELS }, (_, i) => ((i + 1) / LEVELS) * R);

  const labels = axes.map((axis, i) => {
    const angle = angles[i];
    const { x, y } = polarToXY(angle, R + 22);
    let anchor: 'middle' | 'start' | 'end';
    if (angle < 20 || angle > 340) anchor = 'middle';
    else if (angle <= 180) anchor = 'start';
    else anchor = 'end';
    return { label: axis.label, sublabel: axis.sublabel, x, y, anchor };
  });

  const p1pts = polygonPoints(axes.map((a) => a.p1Value), R);
  const p2pts = polygonPoints(axes.map((a) => a.p2Value), R);

  return (
    <svg
      role="img"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width="100%"
      style={{ maxWidth: SIZE, margin: '0 auto', display: 'block', overflow: 'visible' }}
      aria-label="Radar de desempenho"
    >
      {/* Grid */}
      {levels.map((r, li) => {
        const pts = Array.from({ length: n }, (_, i) => {
          const { x, y } = polarToXY(angles[i], r);
          return `${x},${y}`;
        }).join(' ');
        return (
          <polygon
            key={li}
            points={pts}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={li === LEVELS - 1 ? 1.2 : 0.7}
          />
        );
      })}

      {/* % labels no primeiro eixo */}
      {levels.map((r, li) => {
        const { x, y } = polarToXY(0, r);
        return (
          <text key={li} x={x + 3} y={y} fontSize={7} fill="rgba(255,255,255,0.3)" dominantBaseline="middle">
            {((li + 1) / LEVELS) * 100}
          </text>
        );
      })}

      {/* Spokes */}
      {angles.map((angle, i) => {
        const { x, y } = polarToXY(angle, R);
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth={0.8} />;
      })}

      {/* P2 polygon */}
      <polygon
        points={p2pts}
        fill={hexWithAlpha(p2Hex, 0.15)}
        stroke={p2Hex}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />

      {/* P1 polygon */}
      <polygon
        points={p1pts}
        fill={hexWithAlpha(p1Hex, 0.18)}
        stroke={p1Hex}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* P1 dots */}
      {axes.map((a, i) => {
        const { x, y } = polarToXY(angles[i], (a.p1Value / 100) * R);
        return <circle key={i} cx={x} cy={y} r={3} fill={p1Hex} />;
      })}

      {/* P2 dots */}
      {axes.map((a, i) => {
        const { x, y } = polarToXY(angles[i], (a.p2Value / 100) * R);
        return <circle key={i} cx={x} cy={y} r={3} fill={p2Hex} />;
      })}

      {/* Axis labels */}
      {labels.map((l, i) => (
        <g key={i}>
          <text x={l.x} y={l.y - 4} textAnchor={l.anchor} fontSize={9} fontWeight="bold" fill="rgba(255,255,255,0.85)">
            {l.label}
          </text>
          {l.sublabel && (
            <text x={l.x} y={l.y + 7} textAnchor={l.anchor} fontSize={7.5} fill="rgba(255,255,255,0.4)">
              {l.sublabel}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Score bars — também usam as cores do contexto
// ---------------------------------------------------------------------------
function ScoreBar({
  label,
  p1Value,
  p2Value,
  p1Hex,
  p2Hex,
  format = 'pct',
}: {
  label: string;
  p1Value: number;
  p2Value: number;
  p1Hex: string;
  p2Hex: string;
  format?: 'pct' | 'number';
}) {
  const total = p1Value + p2Value || 1;
  const p1Pct = (p1Value / total) * 100;
  const fmt = (v: number) => (format === 'pct' ? `${v.toFixed(0)}%` : String(Math.round(v)));
  return (
    <div className="mb-2">
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="font-mono font-bold" style={{ color: p1Hex }}>{fmt(p1Value)}</span>
        <span className="text-[9px] text-center px-1 truncate text-telemetry-text-muted">{label}</span>
        <span className="font-mono font-bold" style={{ color: p2Hex }}>{fmt(p2Value)}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-white/5">
        <div className="transition-all duration-500" style={{ width: `${p1Pct}%`, background: p1Hex }} />
        <div className="transition-all duration-500" style={{ width: `${100 - p1Pct}%`, background: p2Hex }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
export function PerformanceRadarSection({ stats, player1Name, player2Name }: AdvancedStatsSectionProps) {
  const axes = useMemo(() => computeAxes(stats), [stats]);
  const { serve, returnStats } = stats;
  const colors = usePlayerColors();

  const p1Hex = tailwindClassToHex(colors.p1);
  const p2Hex = tailwindClassToHex(colors.p2);

  const hasData = serve.player1.totalPoints > 0 || serve.player2.totalPoints > 0;
  if (!hasData) return null;

  return (
    <Section title="Radar de Desempenho">
      {/* Legenda */}
      <div className="flex justify-center gap-6 mb-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: p1Hex }} aria-hidden="true" />
          <span className="font-semibold truncate max-w-[120px]" style={{ color: p1Hex }}>{player1Name}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: p2Hex }} aria-hidden="true" />
          <span className="font-semibold truncate max-w-[120px]" style={{ color: p2Hex }}>{player2Name}</span>
        </span>
      </div>

      {/* Radar SVG */}
      <div className="px-4 pb-2">
        <RadarSVG axes={axes} p1Hex={p1Hex} p2Hex={p2Hex} />
      </div>

      {/* Barras comparativas */}
      <div className="mt-4 border-t border-white/10 pt-4 space-y-1">
        {axes.map((axis) => (
          <ScoreBar
            key={axis.label}
            label={axis.label}
            p1Value={axis.p1Value}
            p2Value={axis.p2Value}
            p1Hex={p1Hex}
            p2Hex={p2Hex}
            format="pct"
          />
        ))}
        <ScoreBar
          label="Pontos Totais"
          p1Value={serve.player1.totalPoints + returnStats.player1.totalPoints}
          p2Value={serve.player2.totalPoints + returnStats.player2.totalPoints}
          p1Hex={p1Hex}
          p2Hex={p2Hex}
          format="number"
        />
      </div>
    </Section>
  );
}
