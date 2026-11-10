'use client';

import { useState, useMemo } from 'react';
import type { ReportData } from '@/app/match/[id]/report/report.types';
import type { TimelinePoint } from '@/core/scoring/types';
import type { AdvancedMatchStats, SetBreakdown } from '@/core/report/compute-stats';
import { computeAdvancedStats } from '@/core/report/compute-stats';
import { Section, type AdvancedStatsSectionProps } from './advanced-stats-primitives';
import { usePlayerColors } from '@/components/ui/player-color.context';

// ---------------------------------------------------------------------------
// Props comuns para os componentes premium
// ---------------------------------------------------------------------------
export interface PremiumVisualProps extends AdvancedStatsSectionProps {
  report?: ReportData;
}

// ---------------------------------------------------------------------------
// Helpers de cor para SVGs (compatível com tema dark broadcast e light)
// ---------------------------------------------------------------------------
function tailwindClassToHex(cls: string, fallback: string = '#CCFF00'): string {
  if (cls.includes('telemetry-volt')) return '#CCFF00';
  if (cls.includes('emerald-800')) return '#065F46';
  return fallback;
}

function hexWithAlpha(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ===========================================================================
// 1. SET LENS (Mini-Radar + Barras Comparativas + Destaque Animado do Vencedor)
// ===========================================================================

interface RadarAxisData {
  label: string;
  sublabel: string;
  p1: number;
  p2: number;
}

function computeSetRadarAxes(setStats: AdvancedMatchStats): RadarAxisData[] {
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

function computeSetRadarAxesFromBreakdown(sb: SetBreakdown): RadarAxisData[] {
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

// Mini-Radar SVG Compacto (220x220)
function MiniRadarSvg({
  axes,
  p1ColorHex,
  p2ColorHex,
  player1Name,
  player2Name,
}: {
  axes: RadarAxisData[];
  p1ColorHex: string;
  p2ColorHex: string;
  player1Name: string;
  player2Name: string;
}) {
  const SIZE = 220;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = 72;
  const numAxes = axes.length;

  const getCoordinates = (index: number, val: number) => {
    const angle = (Math.PI * 2 * index) / numAxes - Math.PI / 2;
    const r = (val / 100) * R;
    return {
      x: CX + r * Math.cos(angle),
      y: CY + r * Math.sin(angle),
    };
  };

  const getLabelCoordinates = (index: number) => {
    const angle = (Math.PI * 2 * index) / numAxes - Math.PI / 2;
    const r = R + 18;
    return {
      x: CX + r * Math.cos(angle),
      y: CY + r * Math.sin(angle),
    };
  };

  const rings = [0.25, 0.5, 0.75, 1.0];

  const p1PolygonPoints = axes.map((axis, i) => {
    const { x, y } = getCoordinates(i, axis.p1);
    return `${x},${y}`;
  }).join(' ');

  const p2PolygonPoints = axes.map((axis, i) => {
    const { x, y } = getCoordinates(i, axis.p2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-4 text-xs mb-2">
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p1ColorHex }} />
          <span className="text-telemetry-text-primary truncate max-w-[100px]">{player1Name}</span>
        </span>
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p2ColorHex }} />
          <span className="text-telemetry-text-primary truncate max-w-[100px]">{player2Name}</span>
        </span>
      </div>

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[220px] aspect-square overflow-visible select-none"
        role="img"
        aria-label="Mini-radar de desempenho do set"
      >
        {/* Anéis concêntricos */}
        {rings.map((pct) => {
          const ringPoints = Array.from({ length: numAxes }, (_, i) => {
            const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
            const r = pct * R;
            return `${CX + r * Math.cos(angle)},${CY + r * Math.sin(angle)}`;
          }).join(' ');
          return (
            <polygon
              key={pct}
              points={ringPoints}
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={pct === 1.0 ? 1 : 0.6}
            />
          );
        })}

        {/* Eixos radiais */}
        {axes.map((_, i) => {
          const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
          const endX = CX + R * Math.cos(angle);
          const endY = CY + R * Math.sin(angle);
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={endX}
              y2={endY}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={0.8}
            />
          );
        })}

        {/* Polígono do Jogador 2 (White/Contraste) */}
        <polygon
          points={p2PolygonPoints}
          fill={hexWithAlpha(p2ColorHex, 0.18)}
          stroke={p2ColorHex}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />

        {/* Polígono do Jogador 1 (Volt/Destaque) */}
        <polygon
          points={p1PolygonPoints}
          fill={hexWithAlpha(p1ColorHex, 0.28)}
          stroke={p1ColorHex}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Rótulos dos eixos */}
        {axes.map((axis, i) => {
          const { x, y } = getLabelCoordinates(i);
          const isLeft = x < CX - 6;
          const isRight = x > CX + 6;
          const textAnchor = isRight ? 'start' : isLeft ? 'end' : 'middle';

          return (
            <g key={i}>
              <text
                x={x}
                y={y}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                fontSize={8.5}
                fontWeight="bold"
                fill="rgba(255,255,255,0.85)"
              >
                {axis.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Linha de barra comparativa individual (Head-to-Head style)
interface ComparativeBarRowProps {
  label: string;
  p1Value: number | string;
  p2Value: number | string;
  p1Num: number;
  p2Num: number;
  tone?: 'default' | 'error';
  p1ColorHex: string;
  p2ColorHex: string;
}

function ComparativeBarRow({
  label,
  p1Value,
  p2Value,
  p1Num,
  p2Num,
  tone = 'default',
  p1ColorHex,
  p2ColorHex,
}: ComparativeBarRowProps) {
  const isErrorTone = tone === 'error';
  // No caso de erros, menor número é melhor. No padrão, maior número é melhor.
  const p1Wins = isErrorTone ? p1Num < p2Num && p1Num >= 0 : p1Num > p2Num;
  const p2Wins = isErrorTone ? p2Num < p1Num && p2Num >= 0 : p2Num > p1Num;

  const total = (p1Num + p2Num) || 1;
  const p1Pct = Math.min(100, Math.max(8, (p1Num / total) * 100));
  const p2Pct = Math.min(100, Math.max(8, (p2Num / total) * 100));

  return (
    <div className="py-2 border-b border-white/5 last:border-0">
      <div className="flex justify-between items-center text-xs mb-1">
        <span
          className={`font-mono font-bold text-sm ${p1Wins ? 'scale-105' : 'text-telemetry-text-muted'}`}
          style={{ color: p1Wins ? p1ColorHex : undefined }}
        >
          {p1Value}
        </span>
        <span className="text-[11px] font-semibold text-telemetry-text-muted px-2 uppercase tracking-wide text-center">
          {label}
        </span>
        <span
          className={`font-mono font-bold text-sm ${p2Wins ? 'scale-105' : 'text-telemetry-text-muted'}`}
          style={{ color: p2Wins ? p2ColorHex : undefined }}
        >
          {p2Value}
        </span>
      </div>

      {/* Barras duplas com origem no centro */}
      <div className="grid grid-cols-2 gap-1 items-center h-2 bg-black/20 rounded-full px-0.5">
        {/* Barra P1 (cresce para a esquerda a partir do centro) */}
        <div className="flex justify-end h-full">
          <div
            className="h-full rounded-l-full transition-all duration-500"
            style={{
              width: `${p1Pct}%`,
              backgroundColor: isErrorTone
                ? (p1Wins ? '#10B981' : '#EF4444')
                : (p1Wins ? p1ColorHex : hexWithAlpha(p1ColorHex, 0.35)),
            }}
          />
        </div>

        {/* Barra P2 (cresce para a direita a partir do centro) */}
        <div className="flex justify-start h-full">
          <div
            className="h-full rounded-r-full transition-all duration-500"
            style={{
              width: `${p2Pct}%`,
              backgroundColor: isErrorTone
                ? (p2Wins ? '#10B981' : '#EF4444')
                : (p2Wins ? p2ColorHex : hexWithAlpha(p2ColorHex, 0.35)),
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function SetLensSection({ stats, player1Name, player2Name, report }: PremiumVisualProps) {
  const colors = usePlayerColors();
  const p1Hex = tailwindClassToHex(colors.p1, '#CCFF00');
  const p2Hex = tailwindClassToHex(colors.p2, '#F8FAFC');

  // Determinar sets disponíveis a partir de stats.setBreakdown ou timelinePoints
  const sets = useMemo(() => {
    if (stats.setBreakdown && stats.setBreakdown.length > 0) {
      return stats.setBreakdown;
    }
    // Fallback: se não tiver setBreakdown, simular Set 1 com totais
    return [
      {
        setNumber: 1,
        totalPoints: 0,
        p1Points: 0,
        p2Points: 0,
        p1Games: 0,
        p2Games: 0,
        isTiebreak: false,
        p1Aces: 0,
        p2Aces: 0,
        p1Winners: 0,
        p2Winners: 0,
        p1Errors: 0,
        p2Errors: 0,
      },
    ];
  }, [stats.setBreakdown]);

  const [selectedSet, setSelectedSet] = useState<number>(() => sets[0]?.setNumber ?? 1);

  // Set Breakdown do set selecionado
  const currentSetBreakdown = useMemo(() => {
    return sets.find((s) => s.setNumber === selectedSet) || sets[0];
  }, [sets, selectedSet]);

  // Se houver timelinePoints no report, calcular stats ricas específicas deste set
  const currentSetFullStats = useMemo(() => {
    if (!report?.timelinePoints || report.timelinePoints.length === 0) return null;
    const setPoints = report.timelinePoints.filter((p) => p.setNumber === selectedSet);
    if (setPoints.length === 0) return null;
    try {
      return computeAdvancedStats(setPoints, report.format);
    } catch {
      return null;
    }
  }, [report, selectedSet]);

  // Eixos do radar para o set ativo
  const radarAxes = useMemo(() => {
    if (currentSetFullStats) {
      return computeSetRadarAxes(currentSetFullStats);
    }
    return computeSetRadarAxesFromBreakdown(currentSetBreakdown);
  }, [currentSetFullStats, currentSetBreakdown]);

  // Identificação do vencedor do set
  const setWinnerInfo = useMemo(() => {
    const sb = currentSetBreakdown;
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
  }, [currentSetBreakdown, player1Name, player2Name, p1Hex, p2Hex]);

  // Dados para as barras comparativas
  const compBars = useMemo(() => {
    const sb = currentSetBreakdown;
    const fs = currentSetFullStats;

    const rows: Array<{
      label: string;
      p1Val: string;
      p2Val: string;
      p1Num: number;
      p2Num: number;
      tone?: 'default' | 'error';
    }> = [
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
  }, [currentSetBreakdown, currentSetFullStats]);

  return (
    <Section title="Set Lens — Análise Detalhada por Set">
      {/* TABS POR SET */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1" role="tablist" aria-label="Navegação de sets">
        {sets.map((s) => {
          const isActive = s.setNumber === selectedSet;
          const scoreLabel = `${s.p1Games}-${s.p2Games}`;
          return (
            <button
              key={s.setNumber}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelectedSet(s.setNumber)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-telemetry-active border-2 border-telemetry-volt text-telemetry-text-primary shadow-[0_0_12px_rgba(204,255,0,0.2)]'
                  : 'bg-white/5 border border-white/10 text-telemetry-text-muted hover:bg-white/10'
              }`}
            >
              <span>Set {s.setNumber}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${isActive ? 'bg-telemetry-volt/20 text-telemetry-volt' : 'bg-black/30'}`}>
                {scoreLabel}
                {s.isTiebreak && ' (TB)'}
              </span>
            </button>
          );
        })}
      </div>

      {/* DESTAQUE ANIMADO PARA QUEM VENCEU */}
      {setWinnerInfo.winnerName ? (
        <div
          data-testid="set-winner-highlight"
          className="relative overflow-hidden rounded-xl border border-telemetry-volt/40 bg-gradient-to-r from-telemetry-volt/15 via-telemetry-volt/5 to-transparent p-3.5 mb-5 shadow-[0_0_20px_rgba(204,255,0,0.12)] flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            {/* Indicador pulsante animado */}
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-telemetry-volt opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-telemetry-volt shadow-[0_0_8px_#CCFF00]" />
            </span>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-telemetry-text-muted flex items-center gap-1.5">
                <span>Vencedor do Set {selectedSet}</span>
                <span className="inline-block animate-pulse text-telemetry-volt font-black">● VITORIOSO</span>
              </div>
              <div className="text-base sm:text-lg font-black text-telemetry-text-primary flex items-center gap-2">
                <span>🏆 {setWinnerInfo.winnerName}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-telemetry-volt animate-pulse">
              {setWinnerInfo.scoreText}
            </div>
            {currentSetBreakdown.duration != null && (
              <div className="text-[10px] text-telemetry-text-muted font-mono">
                ⏱️ {currentSetBreakdown.duration} min
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 mb-4 text-xs text-telemetry-text-muted text-center">
          Set {selectedSet} em andamento ou empatado ({currentSetBreakdown.p1Games}x{currentSetBreakdown.p2Games})
        </div>
      )}

      {/* GRID: MINI-RADAR + BARRAS COMPARATIVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-center">
        {/* MINI-RADAR */}
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/25 border border-white/5">
          <div className="text-[11px] font-bold text-telemetry-text-muted uppercase tracking-wider mb-2 text-center">
            Radar de Desempenho (Set {selectedSet})
          </div>
          <MiniRadarSvg
            axes={radarAxes}
            p1ColorHex={p1Hex}
            p2ColorHex={p2Hex}
            player1Name={player1Name}
            player2Name={player2Name}
          />
        </div>

        {/* BARRAS COMPARATIVAS */}
        <div className="rounded-xl bg-black/20 border border-white/5 p-4 space-y-1">
          <div className="text-[11px] font-bold text-telemetry-text-muted uppercase tracking-wider mb-2 flex justify-between">
            <span style={{ color: p1Hex }}>{player1Name}</span>
            <span>Estatísticas Comparativas (Set {selectedSet})</span>
            <span style={{ color: p2Hex }}>{player2Name}</span>
          </div>

          {compBars.map((bar) => (
            <ComparativeBarRow
              key={bar.label}
              label={bar.label}
              p1Value={bar.p1Val}
              p2Value={bar.p2Val}
              p1Num={bar.p1Num}
              p2Num={bar.p2Num}
              tone={bar.tone}
              p1ColorHex={p1Hex}
              p2ColorHex={p2Hex}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}

export const SetLens = SetLensSection;

// ===========================================================================
// 2. FIO DO JOGO (Horizontal Flow Chart dos Scoring Runs + Ponto-a-Ponto)
// ===========================================================================

interface ChronoRun {
  id: string;
  player: 'PLAYER_1' | 'PLAYER_2';
  length: number;
  startIndex: number;
  endIndex: number;
  startPointNumber: number;
  endPointNumber: number;
  setNumber: number;
  gameScore?: { player1: number; player2: number };
  gamesScore?: { player1: number; player2: number };
  aces: number;
  winners: number;
  breakPoints: number;
  points: TimelinePoint[];
}

function extractChronologicalRuns(points: TimelinePoint[]): ChronoRun[] {
  if (!points || points.length === 0) return [];

  const runs: ChronoRun[] = [];
  let currentWinner = points[0].winner;
  let currentPoints: TimelinePoint[] = [points[0]];
  let startIndex = 0;

  for (let i = 1; i < points.length; i++) {
    const pt = points[i];
    if (pt.winner === currentWinner) {
      currentPoints.push(pt);
    } else {
      if (currentPoints.length >= 2) {
        const aces = currentPoints.filter((p) => p.type === 'ACE').length;
        const winners = currentPoints.filter((p) => p.type === 'WINNER').length;
        const breakPoints = currentPoints.filter((p) => p.isBreakPoint).length;
        runs.push({
          id: `run-${startIndex}-${i - 1}`,
          player: currentWinner,
          length: currentPoints.length,
          startIndex,
          endIndex: i - 1,
          startPointNumber: currentPoints[0].pointNumber,
          endPointNumber: currentPoints[currentPoints.length - 1].pointNumber,
          setNumber: currentPoints[0].setNumber,
          gameScore: currentPoints[currentPoints.length - 1].gameScore,
          gamesScore: currentPoints[currentPoints.length - 1].gamesScore,
          aces,
          winners,
          breakPoints,
          points: [...currentPoints],
        });
      }
      currentWinner = pt.winner;
      currentPoints = [pt];
      startIndex = i;
    }
  }

  if (currentPoints.length >= 2) {
    const aces = currentPoints.filter((p) => p.type === 'ACE').length;
    const winners = currentPoints.filter((p) => p.type === 'WINNER').length;
    const breakPoints = currentPoints.filter((p) => p.isBreakPoint).length;
    runs.push({
      id: `run-${startIndex}-${points.length - 1}`,
      player: currentWinner,
      length: currentPoints.length,
      startIndex,
      endIndex: points.length - 1,
      startPointNumber: currentPoints[0].pointNumber,
      endPointNumber: currentPoints[currentPoints.length - 1].pointNumber,
      setNumber: currentPoints[0].setNumber,
      gameScore: currentPoints[currentPoints.length - 1].gameScore,
      gamesScore: currentPoints[currentPoints.length - 1].gamesScore,
      aces,
      winners,
      breakPoints,
      points: [...currentPoints],
    });
  }

  return runs;
}

export function FioDoJogoSection({ stats, player1Name, player2Name, report }: PremiumVisualProps) {
  const colors = usePlayerColors();
  const p1Hex = tailwindClassToHex(colors.p1, '#CCFF00');
  const p2Hex = tailwindClassToHex(colors.p2, '#F8FAFC');

  const [selectedSetFilter, setSelectedSetFilter] = useState<number | 'ALL'>('ALL');
  const [minRunLength, setMinRunLength] = useState<number>(2);
  const [inspectedPoint, setInspectedPoint] = useState<TimelinePoint | null>(null);

  const points = useMemo(() => report?.timelinePoints ?? [], [report?.timelinePoints]);

  // Extrair runs cronológicos a partir de points
  const allChronologicalRuns = useMemo(() => {
    if (points.length > 0) {
      return extractChronologicalRuns(points);
    }
    // Fallback usando stats.momentum.scoringRuns ordenados por start
    if (stats.momentum?.scoringRuns && stats.momentum.scoringRuns.length > 0) {
      return stats.momentum.scoringRuns
        .slice()
        .sort((a, b) => a.start - b.start)
        .map((sr, idx) => ({
          id: `run-fallback-${idx}`,
          player: sr.player,
          length: sr.length,
          startIndex: sr.start,
          endIndex: sr.end,
          startPointNumber: sr.start + 1,
          endPointNumber: sr.end + 1,
          setNumber: 1,
          aces: 0,
          winners: 0,
          breakPoints: 0,
          points: [],
        }));
    }
    return [];
  }, [points, stats.momentum]);

  // Filtrar runs pelo set selecionado e comprimento mínimo
  const filteredRuns = useMemo(() => {
    return allChronologicalRuns.filter((run) => {
      if (selectedSetFilter !== 'ALL' && run.setNumber !== selectedSetFilter) return false;
      if (run.length < minRunLength) return false;
      return true;
    });
  }, [allChronologicalRuns, selectedSetFilter, minRunLength]);

  // Sets presentes nos pontos
  const availableSets = useMemo(() => {
    const s = new Set<number>();
    points.forEach((p) => s.add(p.setNumber));
    if (s.size === 0 && stats.setBreakdown) {
      stats.setBreakdown.forEach((sb) => s.add(sb.setNumber));
    }
    return Array.from(s).sort();
  }, [points, stats.setBreakdown]);

  // Métricas de dominância geral
  const dominanceMetrics = useMemo(() => {
    let p1RunPoints = 0;
    let p2RunPoints = 0;
    let p1SuperRuns = 0;
    let p2SuperRuns = 0;

    allChronologicalRuns.forEach((r) => {
      if (r.player === 'PLAYER_1') {
        p1RunPoints += r.length;
        if (r.length >= 4) p1SuperRuns++;
      } else {
        p2RunPoints += r.length;
        if (r.length >= 4) p2SuperRuns++;
      }
    });

    const totalRunPts = p1RunPoints + p2RunPoints || 1;
    const p1Pct = Math.round((p1RunPoints / totalRunPts) * 100);
    const p2Pct = 100 - p1Pct;

    const maxStreakP1 = stats.momentum.longestStreakP1 ?? stats.momentum.longestWinningStreak ?? 0;
    const maxStreakP2 = stats.momentum.longestStreakP2 ?? stats.momentum.longestLosingStreak ?? 0;

    return {
      p1RunPoints,
      p2RunPoints,
      p1Pct,
      p2Pct,
      p1SuperRuns,
      p2SuperRuns,
      maxStreakP1,
      maxStreakP2,
      totalRuns: allChronologicalRuns.length,
    };
  }, [allChronologicalRuns, stats.momentum]);

  // Pontos filtrados para a fita ponto-a-ponto
  const ribbonPoints = useMemo(() => {
    if (selectedSetFilter === 'ALL') return points;
    return points.filter((p) => p.setNumber === selectedSetFilter);
  }, [points, selectedSetFilter]);

  return (
    <Section title="Fio do Jogo — Momentum & Scoring Runs">
      {/* CABEÇALHO E FILTROS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="text-xs text-telemetry-text-muted">
            Mapeamento horizontal das sequências de domínio e do ritmo da partida
          </div>
        </div>

        {/* Filtros por set e comprimento mínimo */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Sets */}
          <div className="flex items-center gap-1 bg-black/30 p-1 rounded-lg border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setSelectedSetFilter('ALL')}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                selectedSetFilter === 'ALL'
                  ? 'bg-telemetry-active text-telemetry-volt border border-telemetry-volt/40'
                  : 'text-telemetry-text-muted hover:text-white'
              }`}
            >
              Partida Toda
            </button>
            {availableSets.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSetFilter(s)}
                className={`px-2 py-1 rounded font-semibold transition-all ${
                  selectedSetFilter === s
                    ? 'bg-telemetry-active text-telemetry-volt border border-telemetry-volt/40'
                    : 'text-telemetry-text-muted hover:text-white'
                }`}
              >
                Set {s}
              </button>
            ))}
          </div>

          {/* Toggle de Runs Mínimos */}
          <button
            type="button"
            onClick={() => setMinRunLength((prev) => (prev === 2 ? 3 : 2))}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-telemetry-text-muted font-medium transition-colors"
          >
            {minRunLength === 2 ? 'Exibindo: 2+ pts' : 'Exibindo: 3+ pts (Grandes Runs)'}
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMO DE DOMÍNIO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-black/25 rounded-xl border border-white/5 p-3 text-center">
          <div className="text-[10px] uppercase font-bold text-telemetry-text-muted mb-1">
            Domínio em Sequências
          </div>
          <div className="flex justify-center items-center gap-2 font-mono font-black text-lg">
            <span style={{ color: p1Hex }}>{dominanceMetrics.p1Pct}%</span>
            <span className="text-white/20 text-xs">vs</span>
            <span style={{ color: p2Hex }}>{dominanceMetrics.p2Pct}%</span>
          </div>
          <div className="text-[10px] text-telemetry-text-muted mt-0.5">
            {dominanceMetrics.p1RunPoints} pts vs {dominanceMetrics.p2RunPoints} pts em runs
          </div>
        </div>

        <div className="bg-black/25 rounded-xl border border-white/5 p-3 text-center">
          <div className="text-[10px] uppercase font-bold text-telemetry-text-muted mb-1">
            Maior Sequência
          </div>
          <div className="flex justify-center items-center gap-2 font-mono font-black text-lg">
            <span style={{ color: p1Hex }}>{dominanceMetrics.maxStreakP1} pts</span>
            <span className="text-white/20 text-xs">/</span>
            <span style={{ color: p2Hex }}>{dominanceMetrics.maxStreakP2} pts</span>
          </div>
          <div className="text-[10px] text-telemetry-text-muted mt-0.5">
            Pico de domínio individual
          </div>
        </div>

        <div className="bg-black/25 rounded-xl border border-white/5 p-3 text-center">
          <div className="text-[10px] uppercase font-bold text-telemetry-text-muted mb-1">
            Super Runs (4+ Pts)
          </div>
          <div className="flex justify-center items-center gap-2 font-mono font-black text-lg">
            <span style={{ color: p1Hex }}>{dominanceMetrics.p1SuperRuns}</span>
            <span className="text-white/20 text-xs">/</span>
            <span style={{ color: p2Hex }}>{dominanceMetrics.p2SuperRuns}</span>
          </div>
          <div className="text-[10px] text-telemetry-text-muted mt-0.5">
            Sequências arrasadoras
          </div>
        </div>

        <div className="bg-black/25 rounded-xl border border-white/5 p-3 text-center">
          <div className="text-[10px] uppercase font-bold text-telemetry-text-muted mb-1">
            Total de Séries
          </div>
          <div className="font-mono font-black text-lg text-telemetry-text-primary">
            {dominanceMetrics.totalRuns}
          </div>
          <div className="text-[10px] text-telemetry-text-muted mt-0.5">
            Alternâncias de momentum
          </div>
        </div>
      </div>

      {/* FLOW CHART HORIZONTAL DOS SCORING RUNS */}
      <div className="bg-black/30 rounded-xl border border-white/10 p-4 mb-5">
        <div className="flex items-center justify-between text-xs text-telemetry-text-muted mb-3">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p1Hex }} />
            <span>Superior: {player1Name}</span>
          </span>
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            Fluxo de Sequências Consecutivas (Linha do Tempo)
          </span>
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p2Hex }} />
            <span>Inferior: {player2Name}</span>
          </span>
        </div>

        {filteredRuns.length === 0 ? (
          <div className="py-8 text-center text-xs text-telemetry-text-muted">
            Nenhuma sequência consecutiva encontrada com os filtros atuais.
          </div>
        ) : (
          <div className="overflow-x-auto pb-3 pt-2">
            <div className="flex items-center gap-2 min-w-max">
              {filteredRuns.map((run, idx) => {
                const isP1 = run.player === 'PLAYER_1';
                const isSuperRun = run.length >= 4;
                const playerHex = isP1 ? p1Hex : p2Hex;
                const pName = isP1 ? player1Name : player2Name;

                return (
                  <div key={run.id} className="flex items-center gap-2">
                    {/* CARD DO SCORING RUN */}
                    <div
                      data-testid="flow-run-node"
                      className={`relative flex flex-col justify-between w-44 rounded-xl border p-3 transition-all hover:scale-[1.02] ${
                        isP1
                          ? 'border-telemetry-volt/40 bg-telemetry-volt/10 shadow-[0_0_15px_rgba(204,255,0,0.08)] -translate-y-2'
                          : 'border-white/20 bg-white/5 translate-y-2'
                      }`}
                    >
                      {/* Top Header do Card */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className="text-[11px] font-black uppercase tracking-wide truncate max-w-[90px]"
                          style={{ color: playerHex }}
                        >
                          {pName}
                        </span>
                        <span
                          className={`text-xs font-mono font-black px-1.5 py-0.5 rounded ${
                            isSuperRun
                              ? 'bg-telemetry-volt text-black font-extrabold shadow-[0_0_8px_#CCFF00]'
                              : 'bg-black/40 text-telemetry-text-primary'
                          }`}
                        >
                          +{run.length} pts
                        </span>
                      </div>

                      {/* Set e Pontos */}
                      <div className="text-[10px] text-telemetry-text-muted mb-2">
                        Set {run.setNumber} · Pts #{run.startPointNumber} a #{run.endPointNumber}
                      </div>

                      {/* Destaques do Run (Aces, Winners, Breaks) */}
                      <div className="flex flex-wrap gap-1">
                        {isSuperRun && (
                          <span className="text-[9px] font-bold bg-telemetry-volt/20 text-telemetry-volt px-1.5 py-0.5 rounded flex items-center gap-1">
                            🔥 Super Run
                          </span>
                        )}
                        {run.aces > 0 && (
                          <span className="text-[9px] bg-white/10 text-telemetry-text-primary px-1.5 py-0.5 rounded">
                            ⚡ {run.aces} Ace{run.aces > 1 ? 's' : ''}
                          </span>
                        )}
                        {run.winners > 0 && (
                          <span className="text-[9px] bg-white/10 text-telemetry-text-primary px-1.5 py-0.5 rounded">
                            🎯 {run.winners} Winner{run.winners > 1 ? 's' : ''}
                          </span>
                        )}
                        {run.breakPoints > 0 && (
                          <span className="text-[9px] bg-telemetry-alert/20 text-telemetry-alert px-1.5 py-0.5 rounded">
                            💥 Break!
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CONECTOR FLOW (Seta entre nós) */}
                    {idx < filteredRuns.length - 1 && (
                      <div className="flex items-center justify-center px-1 text-white/30" aria-hidden="true">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* FITA PONTO-A-PONTO (BEAD MOMENTUM RIBBON) */}
      {ribbonPoints.length > 0 && (
        <div className="bg-black/20 rounded-xl border border-white/5 p-3.5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-telemetry-text-primary uppercase tracking-wider text-[11px]">
              Fita Ponto-a-Ponto
            </span>
            <span className="text-[10px] text-telemetry-text-muted">
              Passe o mouse ou toque para inspecionar cada ponto
            </span>
          </div>

          {/* Trilha de Contas / Beads com scroll horizontal */}
          <div className="overflow-x-auto pb-2 pt-1">
            <div className="flex items-center gap-1 min-w-max">
              {ribbonPoints.map((pt, index) => {
                const isP1 = pt.winner === 'PLAYER_1';
                const isAce = pt.type === 'ACE';
                const isWinnerShot = pt.type === 'WINNER';
                const isDoubleFault = pt.type === 'DOUBLE_FAULT';
                const isBP = pt.isBreakPoint;

                // Letra de destaque no bead
                let badgeChar = '•';
                if (isAce) badgeChar = 'A';
                else if (isWinnerShot) badgeChar = 'W';
                else if (isDoubleFault) badgeChar = 'DF';
                else if (isBP) badgeChar = 'BP';

                const isSelected = inspectedPoint?.pointNumber === pt.pointNumber;

                return (
                  <button
                    key={pt.pointNumber ?? index}
                    type="button"
                    data-testid="point-bead"
                    data-point-number={pt.pointNumber}
                    onClick={() => setInspectedPoint(pt)}
                    className={`relative flex items-center justify-center rounded-md font-mono font-bold transition-all ${
                      badgeChar.length > 1 ? 'w-6 h-6 text-[8px]' : 'w-5 h-5 text-[9px]'
                    } ${
                      isP1
                        ? 'bg-telemetry-volt text-black hover:ring-2 hover:ring-telemetry-volt'
                        : 'bg-white/90 text-black hover:ring-2 hover:ring-white'
                    } ${isSelected ? 'scale-125 ring-2 ring-white z-10' : ''}`}
                    title={`Ponto #${pt.pointNumber} · Set ${pt.setNumber} · Vencedor: ${isP1 ? player1Name : player2Name} (${pt.type})`}
                  >
                    {badgeChar}
                  </button>
                );
              })}
            </div>
          </div>

          {/* INSPEÇÃO DO PONTO SELECIONADO */}
          {inspectedPoint ? (
            <div className="mt-2.5 p-2.5 rounded-lg bg-black/40 border border-white/10 flex flex-wrap items-center justify-between text-xs animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="font-bold text-telemetry-volt">Ponto #{inspectedPoint.pointNumber}</span>
                <span className="text-white/30">•</span>
                <span>Set {inspectedPoint.setNumber}</span>
                <span className="text-white/30">•</span>
                <span className="font-semibold text-telemetry-text-primary">
                  Vencedor: {inspectedPoint.winner === 'PLAYER_1' ? player1Name : player2Name}
                </span>
                <span className="text-white/30">•</span>
                <span className="text-telemetry-text-muted">Tipo: {inspectedPoint.type}</span>
              </div>
              <div className="text-[11px] text-telemetry-text-muted font-mono">
                Placar: {inspectedPoint.gameScore?.player1 ?? 0}-{inspectedPoint.gameScore?.player2 ?? 0}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-[10px] text-telemetry-text-muted italic">
              Dica: clique em qualquer ponto da fita para abrir a telemetria do lance.
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

export const FioDoJogo = FioDoJogoSection;

