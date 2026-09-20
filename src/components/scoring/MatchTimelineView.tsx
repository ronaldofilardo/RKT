'use client';

import { useState, useMemo, useRef } from 'react';
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
  theme?: 'light' | 'dark';
  comments?: Array<{
    id: string;
    content: string;
    category?: string | null;
    authorName?: string;
    authorId?: string | null;
    createdAt: string | Date;
    hasAudioNote?: boolean;
    audioNoteDuration?: number | null;
  }>;
}

export function MatchTimelineView({ points, player1Name, player2Name, matchId, hideFilters, showFinalResult, comments = [], theme = 'light' }: MatchTimelineViewProps) {
  const isDark = theme === 'dark';
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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
      <div className={`text-center py-12 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
        Nenhum ponto registrado ainda.
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

      <div className="w-full relative overflow-x-auto" ref={scrollContainerRef}>
        <div className="min-w-max">
          <table className={`w-full text-left text-[11px] ${isDark ? 'bg-slate-900 text-slate-300' : 'bg-white text-gray-700'}`} style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
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
              <tr className={`border-b ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-300'}`}>
                <th colSpan={3} className={`px-1.5 py-1 text-center text-[9px] font-semibold uppercase tracking-wide sticky left-0 z-20 border-r ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>SET</th>
                <th colSpan={2} className={`px-1.5 py-1 text-center text-[9px] font-semibold uppercase tracking-wide border-r ${isDark ? 'text-slate-400 border-slate-700' : 'text-gray-500 border-gray-200'}`}>PLACAR</th>
                <th colSpan={5} className={`px-1.5 py-1 text-center text-[9px] font-semibold uppercase tracking-wide border-r ${isDark ? 'text-slate-400 border-slate-700' : 'text-gray-500 border-gray-200'}`}>1º Saque</th>
                <th colSpan={5} className={`px-1.5 py-1 text-center text-[9px] font-semibold uppercase tracking-wide border-r ${isDark ? 'text-slate-400 border-slate-700' : 'text-gray-500 border-gray-200'}`}>2º Saque</th>
                <th rowSpan={2} className={`px-1.5 py-1 text-center text-[9px] font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>SITUAÇÃO</th>
                <th rowSpan={2} aria-label="TIPO (ENF, EF, W)" className={`px-1.5 py-1 text-center text-[9px] font-semibold uppercase tracking-wide border-l ${isDark ? 'text-slate-400 border-slate-700' : 'text-gray-500 border-gray-200'}`}>
                  <div className="flex flex-col leading-tight">
                    <span>TIPO</span>
                    <span className={`text-[7px] font-normal normal-case ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>ENF, EF, W</span>
                  </div>
                </th>
                <th rowSpan={2} className={`px-1.5 py-1 text-center text-[9px] font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>ERRO</th>
                <th rowSpan={2} className={`px-1.5 py-1 text-center text-[9px] font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>ONDE</th>
                <th rowSpan={2} className={`px-1.5 py-1 text-center text-[9px] font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>GOLPE</th>
                <th rowSpan={2} className={`px-1.5 py-1 text-center text-[9px] font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>EFEITO</th>
                <th rowSpan={2} className={`px-1.5 py-1 text-center text-[9px] font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>DIREÇÃO</th>
                <th rowSpan={2} className={`px-1.5 py-1 text-center text-[9px] font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>ESPECIAL</th>
                <th rowSpan={2} className={`px-1.5 py-1 text-center text-[9px] font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>RALLY</th>
                <th rowSpan={2} className={`px-1.5 py-1 text-center text-[9px] font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>OBS</th>
              </tr>
              <tr className={`border-b ${isDark ? 'bg-slate-850 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                <th className={`px-1 py-1 text-center text-[8px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>no.</th>
                <th className={`px-1 py-1 text-center text-[8px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>P/</th>
                <th className={`px-1 py-1 text-center text-[8px] font-semibold uppercase border-r ${isDark ? 'text-slate-400 border-slate-700' : 'text-gray-500 border-gray-200'}`}>SAC</th>
                <th className={`px-1 py-1 text-center text-[8px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>GAMES</th>
                <th className={`px-1 py-1 text-center text-[8px] font-semibold uppercase border-r ${isDark ? 'text-slate-400 border-slate-700' : 'text-gray-500 border-gray-200'}`}>PONTOS</th>
                <th className={`px-1 py-1 text-center text-[8px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>ACE</th>
                <th className={`px-1 py-1 text-center text-[8px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>OUT</th>
                <th className={`px-1 py-1 text-center text-[8px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>NET</th>
                <th className={`px-1 py-1 text-center text-[8px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>EFE</th>
                <th className={`px-1 py-1 text-center text-[8px] font-semibold uppercase border-r ${isDark ? 'text-slate-400 border-slate-700' : 'text-gray-500 border-gray-200'}`}>DIR</th>
                <th className={`px-1 py-1 text-center text-[8px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>ACE</th>
                <th className={`px-1 py-1 text-center text-[8px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>OUT</th>
                <th className={`px-1 py-1 text-center text-[8px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>NET</th>
                <th className={`px-1 py-1 text-center text-[8px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>EFE</th>
                <th className={`px-1 py-1 text-center text-[8px] font-semibold uppercase border-r ${isDark ? 'text-slate-400 border-slate-700' : 'text-gray-500 border-gray-200'}`}>DIR</th>
              </tr>
            </thead>
            <tbody>
              {hasActiveFilters && filteredPoints.length === 0 && (
                <tr><td colSpan={25} className={`text-center py-6 text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Nenhum ponto corresponde aos filtros selecionados.</td></tr>
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
                  theme={theme}
                />
              ))}
              {showFinalResult && (() => {
                const setResults = getSetResults(points);
                return (
                  <tr className={`border-t-2 font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-300'}`}>
                    <td colSpan={3} className={`px-1.5 py-2 text-[10px] sticky left-0 z-10 border-r text-right pr-3 ${isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                      Resultado
                    </td>
                    <td colSpan={2} className={`px-1.5 py-2 text-[10px] border-r ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                      <div className="flex flex-col leading-tight">
                        {setResults.map((sr) => (
                          <span key={sr.setNumber} className={isDark ? 'text-slate-200' : 'text-gray-700'}>
                            {sr.p1}x{sr.p2}
                            {sr.tiebreak ? ` (${sr.tiebreak.p1}x{sr.tiebreak.p2})` : ''}
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

      {comments.length > 0 && (
        <div className={`mt-3 border rounded-lg px-3 py-2 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-amber-50 border-amber-200'}`}>
          <h4 className={`font-semibold text-[11px] mb-2 ${isDark ? 'text-amber-500' : 'text-amber-800'}`}>
            Anotações da Partida
          </h4>
          <div className="space-y-2">
            {comments.map((c) => (
              <div key={c.id} className={`rounded-lg px-3 py-2 border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-amber-100'}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`text-[11px] ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>{c.content}</span>
                  {c.hasAudioNote && (
                    <AudioNotePlayer matchId={matchId} commentId={c.id} durationMs={c.audioNoteDuration ?? undefined} />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {c.authorName && <span className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{c.authorName}</span>}
                  {c.authorName && <span className={`text-[9px] ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>·</span>}
                  <span className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{new Date(c.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  {c.category && (
                    <>
                      <span className={`text-[9px] ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>·</span>
                      <span className={`text-[9px] font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{c.category}</span>
                    </>
                  )}
                  {c.hasAudioNote && !c.audioNoteDuration && (
                    <span className={`text-[9px] ${isDark ? 'text-emerald-400' : 'text-green-600'}`}>🎤</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`mt-3 text-[10px] border rounded-lg px-3 py-2 space-y-1 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
        <p className={`font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
          Como ler a tabela
        </p>
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