'use client';

import { useState, useMemo } from 'react';
import type { TimelinePoint } from '@/core/scoring/types';
import {
  filterTimelinePoints,
  countByFilter,
} from './timeline-utils';
import type { FilterKey, FilterCriteria } from './timeline-types';
import { FilterBar } from './timeline-filters';
import { SetGroup } from './timeline-rows';

interface MatchTimelineViewProps {
  points: TimelinePoint[];
  player1Name: string;
  player2Name: string;
  matchId: string;
}

export function MatchTimelineView({ points, player1Name, player2Name, matchId }: MatchTimelineViewProps) {
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

  const filterCriteria = useMemo(() => {
    const criteria: FilterCriteria = {};
    if (activeFilters.has('p1')) criteria.playerWinner = 'PLAYER_1';
    else if (activeFilters.has('p2')) criteria.playerWinner = 'PLAYER_2';
    if (activeFilters.has('bp')) criteria.breakPointsOnly = true;
    if (activeFilters.has('winners')) criteria.winnersOnly = true;
    if (activeFilters.has('errors')) criteria.errorsOnly = true;
    return criteria;
  }, [activeFilters]);

  const hasActiveFilters = activeFilters.size > 0;

  const filteredPoints = useMemo(
    () => hasActiveFilters ? filterTimelinePoints(points, filterCriteria) : points,
    [points, filterCriteria, hasActiveFilters],
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

  const counts = useMemo(() => ({
    p1: countByFilter(points, p => p.winner === 'PLAYER_1'),
    p2: countByFilter(points, p => p.winner === 'PLAYER_2'),
    bp: countByFilter(points, p => p.isBreakPoint),
    winners: countByFilter(points, p => p.type === 'WINNER' || p.type === 'ACE'),
    errors: countByFilter(points, p =>
      p.type === 'UNFORCED_ERROR' || p.type === 'FORCED_ERROR' || p.type === 'DOUBLE_FAULT'
    ),
  }), [points]);

  if (points.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        Esta sessão não possui pontos detalhados registrados.
      </div>
    );
  }

  return (
    <div>
      <FilterBar
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
        onClearFilters={clearFilters}
        counts={counts}
        playerNames={{ p1: player1Name, p2: player2Name }}
      />

      <p className="text-xs text-gray-500 mb-3">
        {hasActiveFilters
          ? `${filteredPoints.length} de ${points.length} pontos`
          : `${points.length} pontos`}
      </p>

      <div className="mb-3 text-[10px] text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 space-y-1">
        <p className="font-semibold text-gray-700 mb-1">Como ler esta tabela</p>
        <p>Cada linha é um ponto disputado, na ordem em que aconteceu. <strong>SET</strong> identifica o set e o sacador ([S] = sacador) quando o sacador é fixo no set; <strong>VENCEDOR</strong> mostra quem ganhou o ponto (nome destacado em azul = {player1Name}, em vermelho = {player2Name}).</p>
        <p><strong>GAMES</strong> = placar de games/set no momento do ponto (mostrado só no 1º ponto de cada game para reduzir repetição) · <strong>PONTOS</strong> = placar de pontos dentro daquele game (ex: 15-0, Deuce, Adv. P1).</p>
        <p><strong>BP</strong> = Break Point · <strong>GB</strong> = Game Ball (bola de game) · <strong>SB</strong> = Set Ball (bola de set)</p>
        <p><strong>TIPO</strong>: <strong>ACe</strong> = Ace · <strong>DF</strong> = Dupla Falta · <strong>Winner</strong> = ponto vencedor direto · <strong>ENF</strong> = Erro Não Forçado · <strong>EF</strong> = Erro Forçado</p>
                <p><strong>SEQ</strong> preserva a ordem persistida do ponto. <strong>SITUAÇÃO / ZONA / STROKE / GOLPE / EFEITO / DIREÇÃO / ONDE ERROU / SUBTIPO</strong> descrevem como o ponto terminou e os metadados brutos do scout.</p>

        <p><strong>TROCAS</strong> = quantidade de bolas trocadas no ponto, agrupada em faixas (1-2, 3-6, 7-10, 11+) · <strong>ESPECIAL</strong> = golpe especial usado (lob, drop shot, bate-pronto, etc.), quando aplicável.</p>
      </div>

      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]" style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                        <colgroup>
              <col style={{ width: '9%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '4%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '9%' }} />
            </colgroup>

            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                                {['SET', 'GAMES', 'PONTOS', 'SEQ', 'VENCEDOR', 'TIPO', 'SITUAÇÃO', 'ZONA', 'STROKE', 'GOLPE', 'EFEITO', 'DIREÇÃO', 'ONDE ERROU', 'SUBTIPO', '1ª FALTA', '2ª FALTA', 'TROCAS', 'ESPECIAL', 'OBSERVAÇÃO'].map((h, idx) => (

                  <th
                    key={h}
                    className={`px-1.5 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-normal ${idx === 0 ? 'sticky left-0 bg-gray-50 z-20 border-r border-gray-200' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hasActiveFilters && filteredPoints.length === 0 && (
                <tr><td colSpan={19} className="text-center py-6 text-gray-400 text-xs">Nenhum ponto corresponde aos filtros selecionados.</td></tr>
              )}
              {groupedBySet.map((group, gi) => (
                <SetGroup
                  key={group.setNumber}
                  setNumber={group.setNumber}
                  points={group.points}
                  allPoints={points}
                  hasActiveFilters={hasActiveFilters}
                  player1Name={player1Name}
                  player2Name={player2Name}
                  isLast={gi === groupedBySet.length - 1}
                  matchId={matchId}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}