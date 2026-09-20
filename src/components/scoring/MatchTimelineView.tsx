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
import { AudioNotePlayer } from './AudioNotePlayer';

function getSetResults(points: TimelinePoint[]): { setNumber: number; p1: number; p2: number; tiebreak?: { p1: number; p2: number } }[] {
  const results: { setNumber: number; p1: number; p2: number; tiebreak?: { p1: number; p2: number } }[] = [];
  for (const p of points) {
    const existing = results.find(r => r.setNumber === p.setNumber);
    if (existing) {
      existing.p1 = p.gamesScore.player1;
      existing.p2 = p.gamesScore.player2;
      if (p.isTiebreak) {
        existing.tiebreak = { p1: p.gameScore.player1, p2: p.gameScore.player2 };
      }
    } else {
      results.push({
        setNumber: p.setNumber,
        p1: p.gamesScore.player1,
        p2: p.gamesScore.player2,
        tiebreak: p.isTiebreak ? { p1: p.gameScore.player1, p2: p.gameScore.player2 } : undefined,
      });
    }
  }
  return results;
}

interface MatchTimelineViewProps {
  points: TimelinePoint[];
  player1Name: string;
  player2Name: string;
  matchId: string;
  hideFilters?: boolean;
  showFinalResult?: boolean;
  comments?: Array<{
    id: string;
    content: string;
    category?: string | null;
    authorName: string;
    createdAt: string;
    hasAudioNote?: boolean;
    audioNoteDuration?: number | null;
  }>;
}

export function MatchTimelineView({ points, player1Name, player2Name, matchId, hideFilters, showFinalResult, comments = [] }: MatchTimelineViewProps) {
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
      {!hideFilters && (
        <>
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
        </>
      )}

      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            <table className="w-full text-[11px]" style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
              <colgroup>
                <col style={{ width: '3%' }} />
                <col style={{ width: '3%' }} />
                <col style={{ width: '5%' }} />
                <col style={{ width: '3%' }} />
                <col style={{ width: '4%' }} />
                <col style={{ width: '5%' }} />
                <col style={{ width: '3%' }} />
                <col style={{ width: '3%' }} />
                <col style={{ width: '3%' }} />
                <col style={{ width: '4%' }} />
                <col style={{ width: '4%' }} />
                <col style={{ width: '3%' }} />
                <col style={{ width: '3%' }} />
                <col style={{ width: '3%' }} />
                <col style={{ width: '4%' }} />
                <col style={{ width: '4%' }} />
                <col style={{ width: '5%' }} />
                <col style={{ width: '4%' }} />
                <col style={{ width: '4%' }} />
                <col style={{ width: '4%' }} />
                <col style={{ width: '4%' }} />
                <col style={{ width: '4%' }} />
                <col style={{ width: '4%' }} />
                <col style={{ width: '5%' }} />
                <col style={{ width: '4%' }} />
              </colgroup>

              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th colSpan={3} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide sticky left-0 bg-gray-100 z-20 border-r border-gray-300">SET</th>
                  <th colSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-200">PLACAR</th>
                  <th colSpan={5} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-200">1º Saque</th>
                  <th colSpan={5} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-200">2º Saque</th>
                  <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide">SITUAÇÃO</th>
                  <th rowSpan={2} aria-label="TIPO (ENF, EF, W)" className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide border-l border-gray-200">
                    <div className="flex flex-col leading-tight">
                      <span>TIPO</span>
                      <span className="text-[7px] font-normal text-gray-400 normal-case">ENF, EF, W</span>
                    </div>
                  </th>
                  <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide">ERRO</th>
                  <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide">ONDE</th>
                  <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide">GOLPE</th>
                  <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide">EFEITO</th>
                  <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide">DIREÇÃO</th>
                  <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide">ESPECIAL</th>
                  <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide">RALLY</th>
                  <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide">OBS</th>
                </tr>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">no.</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">P/</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase border-r border-gray-200">SAC</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">GAMES</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase border-r border-gray-200">PONTOS</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">ACE</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">OUT</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">NET</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">EFE</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase border-r border-gray-200">DIR</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">ACE</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">OUT</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">NET</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase">EFE</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-gray-500 uppercase border-r border-gray-200">DIR</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {hasActiveFilters && filteredPoints.length === 0 && (
                  <tr><td colSpan={25} className="text-center py-6 text-gray-400 text-xs">Nenhum ponto corresponde aos filtros selecionados.</td></tr>
                )}
                {groupedBySet.map((group, gi) => (
                  <SetGroup
                    key={group.setNumber}
                    setNumber={group.setNumber}
                    points={group.points}
                    allPoints={points}
                    hasActiveFilters={hasActiveFilters}
                    isLast={gi === groupedBySet.length - 1}
                    matchId={matchId}
                    player1Name={player1Name}
                    player2Name={player2Name}
                  />
                ))}
                {showFinalResult && (() => {
                  const setResults = getSetResults(points);
                  return (
                    <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                      <td colSpan={3} className="px-1.5 py-2 text-[10px] text-gray-700 sticky left-0 bg-gray-100 z-10 border-r border-gray-300 text-right pr-3">
                        Resultado
                      </td>
                      <td colSpan={2} className="px-1.5 py-2 text-[10px] border-r border-gray-200">
                        <div className="flex flex-col leading-tight">
                          {setResults.map((sr) => (
                            <span key={sr.setNumber} className="text-gray-700">
                              {sr.p1}x{sr.p2}
                              {sr.tiebreak ? ` (${sr.tiebreak.p1}x${sr.tiebreak.p2})` : ''}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td colSpan={20} aria-hidden="true" />
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {comments.length > 0 && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <p className="font-semibold text-amber-800 text-[11px] mb-2">💬 Comentários</p>
          <div className="space-y-2">
            {comments.map((c) => (
              <div key={c.id} className="bg-white rounded-lg px-3 py-2 border border-amber-100">
                <p className="text-[11px] text-gray-800">{c.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] text-gray-500">{c.authorName}</span>
                  <span className="text-[9px] text-gray-400">·</span>
                  <span className="text-[9px] text-gray-400">{new Date(c.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  {c.category && (
                    <>
                      <span className="text-[9px] text-gray-400">·</span>
                      <span className="text-[9px] text-amber-600 font-medium">{c.category}</span>
                    </>
                  )}
                  {c.hasAudioNote && (
                    <div className="ml-1">
                      <AudioNotePlayer
                        matchId={matchId}
                        commentId={c.id}
                        durationMs={c.audioNoteDuration || undefined}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 text-[10px] text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 space-y-1">
        <p className="font-semibold text-gray-700 mb-1">Como ler esta tabela</p>
        <p>Cada linha é um ponto disputado, na ordem em que aconteceu. <strong>no.</strong> = número do ponto; <strong>P/</strong> = ganhador do ponto ({player1Name}/{player2Name}); <strong>SAC</strong> = sacador ({player1Name}/{player2Name}).</p>
        <p><strong>GAMES</strong> = placar de games/set (mostrado só no 1º ponto de cada game).</p>
        <p><strong>PONTOS</strong> = placar de pontos (15-0, Deuce, Adv. P1).</p>
        <p><strong>1º / 2º Saque</strong>: mostra ACE, OUT ou NET conforme o resultado de cada saque, além de efeito e direção. Apenas um dos saques é preenchido por ponto.</p>
        <p><strong>TIPO</strong>: <strong>ACe</strong> = Ace · <strong>DF</strong> = Dupla Falta · <strong>Winner</strong> = ponto vencedor direto · <strong>ENF</strong> = Erro Não Forçado · <strong>EF</strong> = Erro Forçado</p>
        <p><strong>ERRO</strong> = tipo de erro na rede (Passing Shot, Devolução). <strong>ONDE</strong> = onde errou (Out, Net).</p>
        <p><strong>SITUAÇÃO / GOLPE / EFEITO / DIREÇÃO</strong> descrevem como o ponto terminou.</p>
        <p><strong>ESPECIAL</strong> = golpe especial (lob, drop shot, etc.).</p>
        <p><strong>RALLY</strong> = faixa de bolas trocadas conforme duração marcada (3-6, 7-10, 11+).</p>
      </div>
    </div>
  );
}