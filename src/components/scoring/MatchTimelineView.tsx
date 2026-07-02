'use client';

import { useState, useMemo } from 'react';
import type { TimelinePoint } from '@/core/scoring/types';
import {
  filterTimelinePoints,
  countByFilter,
  getGameScoreLabelForPoint,
  formatAceOrDf,
  situacaoLabel,
  golpeLabel,
  direcaoLabel,
  efeitoLabel,
  golpeEspLabel,
  subtipo1Label,
  subtipo2Label,
} from './timeline-utils';

interface MatchTimelineViewProps {
  points: TimelinePoint[];
  player1Name: string;
  player2Name: string;
}

type FilterKey = 'p1' | 'p2' | 'bp' | 'winners' | 'errors';

export function MatchTimelineView({ points, player1Name, player2Name }: MatchTimelineViewProps) {
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());

  const toggleFilter = (key: FilterKey) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearFilters = () => setActiveFilters(new Set());

  const filterCriteria = useMemo(() => ({
    playerWinner: activeFilters.has('p1') ? 'PLAYER_1' as const : activeFilters.has('p2') ? 'PLAYER_2' as const : undefined,
    breakPointsOnly: activeFilters.has('bp'),
    winnersOnly: activeFilters.has('winners'),
    errorsOnly: activeFilters.has('errors'),
  }), [activeFilters]);

  const hasActiveFilters = activeFilters.size > 0;

  const enrichedPoints = points;

  const filteredPoints = useMemo(
    () => hasActiveFilters ? filterTimelinePoints(enrichedPoints, filterCriteria) : enrichedPoints,
    [enrichedPoints, filterCriteria, hasActiveFilters],
  );

  const groupedBySet = useMemo(() => {
    const groups: { setNumber: number; points: TimelinePoint[] }[] = [];
    for (const p of filteredPoints) {
      let group = groups[groups.length - 1];
      if (!group || group.setNumber !== p.setNumber) {
        group = { setNumber: p.setNumber, points: [] };
        groups.push(group);
      }
      group.points.push(p);
    }
    return groups;
  }, [filteredPoints]);

  const countP1 = useMemo(() => countByFilter(enrichedPoints, p => p.winner === 'PLAYER_1'), [enrichedPoints]);
  const countP2 = useMemo(() => countByFilter(enrichedPoints, p => p.winner === 'PLAYER_2'), [enrichedPoints]);
  const countBP = useMemo(() => countByFilter(enrichedPoints, p => p.isBreakPoint), [enrichedPoints]);
  const countWinners = useMemo(() => countByFilter(enrichedPoints, p => p.type === 'WINNER' || p.type === 'ACE'), [enrichedPoints]);
  const countErrors = useMemo(() => countByFilter(enrichedPoints, p =>
    p.type === 'UNFORCED_ERROR' || p.type === 'FORCED_ERROR' || p.type === 'DOUBLE_FAULT'), [enrichedPoints]);

  if (enrichedPoints.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        Esta sessão não possui pontos detalhados registrados.
      </div>
    );
  }

  return (
    <div>
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Filtros da timeline">
        <Chip
          label={`${player1Name} (${countP1})`}
          active={activeFilters.has('p1')}
          color="blue"
          onClick={() => toggleFilter('p1')}
        />
        <Chip
          label={`${player2Name} (${countP2})`}
          active={activeFilters.has('p2')}
          color="rose"
          onClick={() => toggleFilter('p2')}
        />
        {countBP > 0 && (
          <Chip
            label={`Breakpoints (${countBP})`}
            active={activeFilters.has('bp')}
            color="gray"
            onClick={() => toggleFilter('bp')}
          />
        )}
        <Chip
          label={`Winners / Aces (${countWinners})`}
          active={activeFilters.has('winners')}
          color="gray"
          onClick={() => toggleFilter('winners')}
        />
        <Chip
          label={`Erros (${countErrors})`}
          active={activeFilters.has('errors')}
          color="gray"
          onClick={() => toggleFilter('errors')}
        />
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-xs font-semibold rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100"
          >
            ✕ Limpar
          </button>
        )}
      </div>

      {/* Count header */}
      <p className="text-xs text-gray-500 mb-3">
        {hasActiveFilters
          ? `${filteredPoints.length} de ${enrichedPoints.length} pontos`
          : `${enrichedPoints.length} pontos`}
      </p>

      {/* Table */}
      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]" style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
            <colgroup>
              <col style={{ width: '8%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '7%' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['SAQUE', 'GAME', 'PONTO', 'ACE / DF', 'TROCAS', 'SITUAÇÃO', 'RESULTADO', 'GOLPE', 'TIPO ERRO', 'ONDE ERROU', 'DIREÇÃO', 'EFEITO', 'ESPECIAIS'].map(h => (
                  <th key={h} className="px-1.5 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {noFiltersActiveCheck(hasActiveFilters, filteredPoints, enrichedPoints) && (
                <tr><td colSpan={13} className="text-center py-6 text-gray-400 text-xs">Nenhum ponto corresponde aos filtros selecionados.</td></tr>
              )}
              {groupedBySet.map((group, gi) => (
                <SetGroup
                  key={group.setNumber}
                  setNumber={group.setNumber}
                  points={group.points}
                  allPoints={enrichedPoints}
                  hasActiveFilters={hasActiveFilters}
                  player1Name={player1Name}
                  player2Name={player2Name}
                  isLast={gi === groupedBySet.length - 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function noFiltersActiveCheck(hasFilters: boolean, filtered: TimelinePoint[], enriched: TimelinePoint[]): boolean {
  return hasFilters && filtered.length === 0 && enriched.length > 0;
}

function SetGroup({ setNumber, points, allPoints, hasActiveFilters, player1Name, player2Name, isLast }: {
  setNumber: number;
  points: TimelinePoint[];
  allPoints: TimelinePoint[];
  hasActiveFilters: boolean;
  player1Name: string;
  player2Name: string;
  isLast: boolean;
}) {
  const firstPoint = points[0];
  const server = firstPoint?.server === 'player1' ? player1Name : player2Name;
  const receiver = firstPoint?.server === 'player1' ? player2Name : player1Name;

  return (
    <>
      {/* Set separator */}
      <tr className="bg-gray-100 border-b border-gray-200">
        <td colSpan={3} className="px-1.5 py-2">
          <span className="text-[9px] font-black uppercase text-blue-600" style={{ letterSpacing: '0.12em' }}>SET {setNumber}</span>
        </td>
        <td colSpan={10} className="px-1.5 py-2">
          <span className="text-[10px] text-gray-500">{server} – {receiver}</span>
        </td>
      </tr>

      {points.map((p, i) => {
        const prevPoint = i > 0 ? points[i - 1] : null;
        const hasGap = !hasActiveFilters && prevPoint && p.pointNumber - prevPoint.pointNumber > 1;

        return (
          <PointRow
            key={`${p.setNumber}-${p.pointNumber}`}
            point={p}
            hasGap={!!hasGap}
            isLast={isLast && i === points.length - 1}
          />
        );
      })}
    </>
  );
}

function PointRow({ point: p, hasGap, isLast }: { point: TimelinePoint; hasGap: boolean; isLast: boolean }) {
  const isServeFinish = p.type === 'ACE' || p.type === 'DOUBLE_FAULT';
  const rowClass = [
    'border-b border-gray-100 hover:bg-gray-50 transition-colors',
    p.winner === 'PLAYER_1' ? 'border-l-[3px] border-l-blue-500' : 'border-l-[3px] border-l-red-500',
    p.isBreakPoint ? 'bg-amber-50/40' : '',
  ].join(' ');

  const serverBallColor = p.server === 'player1' ? 'drop-shadow(0 0 2px #3b82f6)' : 'drop-shadow(0 0 2px #ef4444)';

  return (
    <>
      {hasGap && (
        <tr>
          <td colSpan={13} className="text-center py-1.5">
            <span className="text-[10px] italic text-gray-400 border-t border-dashed border-b border-dashed border-gray-300 px-2">marcação interrompida</span>
          </td>
        </tr>
      )}
      <tr className={rowClass} aria-label={`Ponto: ${p.winner === 'PLAYER_1' ? 'P1' : 'P2'} venceu`}>
        {/* SAQUE */}
        <td className="px-1.5 py-1.5 align-middle">
          <div className="flex items-center gap-0.5">
            <svg width="14" height="14" viewBox="0 0 18 18" style={{ filter: serverBallColor }}>
              <circle cx="9" cy="9" r="7" fill="#CCFF00" />
              <path d="M5 5 Q9 9 13 5" stroke="white" strokeWidth="1.5" fill="none" />
              <path d="M5 13 Q9 9 13 13" stroke="white" strokeWidth="1.5" fill="none" />
            </svg>
            {p.isBreakPoint && <Tag className="bg-amber-100 text-amber-700">BP</Tag>}
            {p.isGameBall && <Tag className="bg-yellow-100 text-yellow-700">GB</Tag>}
            {p.isSetBall && <Tag className="bg-purple-100 text-purple-700">SB</Tag>}
          </div>
        </td>

        {/* GAME */}
        <td className="px-1.5 py-1.5 text-[10px] text-gray-500">{p.gamesScore.player1}-{p.gamesScore.player2}</td>

        {/* PONTO */}
        <td className="px-1.5 py-1.5 text-[10px] font-bold text-gray-800">{getGameScoreLabelForPoint(p)}</td>

        {/* ACE / DF */}
        <td className={`px-1.5 py-1.5 text-[10px] ${p.type === 'ACE' ? 'text-green-600 font-semibold' : p.type === 'DOUBLE_FAULT' ? 'text-red-600 font-semibold' : ''}`}>
          {formatAceOrDf(p)}
        </td>

        {/* TROCAS */}
        <td className="px-1.5 py-1.5 text-[10px] text-gray-500">{isServeFinish ? 1 : p.rallyLength || 1}</td>

        {/* SITUAÇÃO */}
        <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isServeFinish ? '' : situacaoLabel(p.rallyDetails?.situacao)}</td>

        {/* RESULTADO */}
        <td className={`px-1.5 py-1.5 text-[10px] font-bold ${p.type === 'WINNER' ? 'text-green-600' : p.type === 'UNFORCED_ERROR' ? 'text-red-600' : p.type === 'FORCED_ERROR' ? 'text-amber-600' : ''}`}>
          {isServeFinish ? '' : (
            p.type === 'WINNER' ? 'Winner'
            : p.type === 'UNFORCED_ERROR' ? 'ENF'
            : p.type === 'FORCED_ERROR' ? 'EF'
            : ''
          )}
        </td>

        {/* GOLPE */}
        <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isServeFinish ? '' : golpeLabel(p.rallyDetails?.golpe)}</td>

        {/* TIPO ERRO */}
        <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isServeFinish ? '' : subtipo1Label(p.rallyDetails?.subtipo1)}</td>

        {/* ONDE ERROU */}
        <td className={`px-1.5 py-1.5 text-[10px] ${p.rallyDetails?.subtipo2 === 'out' ? 'text-red-600 font-semibold' : p.rallyDetails?.subtipo2 === 'net' ? 'text-amber-600 font-semibold' : ''}`}>
          {isServeFinish ? '' : subtipo2Label(p.rallyDetails?.subtipo2)}
        </td>

        {/* DIREÇÃO */}
        <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isServeFinish ? '' : direcaoLabel(p.rallyDetails?.direcao)}</td>

        {/* EFEITO */}
        <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isServeFinish && p.type === 'ACE' ? efeitoLabel(p.rallyDetails?.efeito) : isServeFinish ? '' : efeitoLabel(p.rallyDetails?.efeito)}</td>

        {/* ESPECIAIS */}
        <td className="px-1.5 py-1.5 text-[10px] text-gray-600">{isServeFinish ? '' : golpeEspLabel(p.rallyDetails?.golpe_esp)}</td>
      </tr>
    </>
  );
}

function Chip({ label, active, color, onClick }: { label: string; active: boolean; color: 'blue' | 'rose' | 'gray'; onClick: () => void }) {
  const colorMap = {
    blue: active ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 text-gray-600 border-gray-200',
    rose: active ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-gray-100 text-gray-600 border-gray-200',
    gray: active ? 'bg-gray-200 text-gray-800 border-gray-400' : 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${colorMap[color]}`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function Tag({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={`text-[7px] font-bold px-[3px] py-[1px] rounded leading-none ${className ?? ''}`}>
      {children}
    </span>
  );
}
