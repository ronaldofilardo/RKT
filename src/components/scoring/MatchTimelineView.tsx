'use client';

import { useState, useMemo } from 'react';
import type { TimelinePoint } from '@/core/scoring/types';
import {
  filterTimelinePoints,
  countByFilter,
  isSetDecidingPoint,
} from './timeline-utils';
import type { FilterKey, FilterCriteria } from './timeline-types';
import { FilterBar } from './timeline-filters';
import { SetGroup } from './timeline-rows';
import { AudioNotePlayer } from './AudioNotePlayer';

export interface SetResult {
  setNumber: number;
  p1: number;
  p2: number;
  tiebreak?: { p1: number; p2: number };
}

/** Forma mínima de set lida por esta extração. */
interface RawSet {
  player1?: number;
  player2?: number;
  isTiebreak?: boolean;
  tiebreakScore?: { player1?: number; player2?: number } | null;
}

/** Envelope `{state, history}` que o scoreState pode trazer. */
interface RawScoreStateEnvelope {
  state?: { sets?: RawSet[] };
  sets?: RawSet[];
}

export function extractSetsFromScoreState(scoreState: unknown): SetResult[] | null {
  if (!scoreState) return null;
  let raw = scoreState;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== 'object') return null;

  const envelope = raw as RawScoreStateEnvelope;
  const stateObj = envelope.state && typeof envelope.state === 'object' ? envelope.state : envelope;

  const sets = stateObj.sets;
  if (!Array.isArray(sets) || sets.length === 0) return null;

  const hasScores = sets.some(
    (s) =>
      (s.player1 ?? 0) > 0 ||
      (s.player2 ?? 0) > 0 ||
      Boolean(s.tiebreakScore && ((s.tiebreakScore.player1 ?? 0) > 0 || (s.tiebreakScore.player2 ?? 0) > 0)),
  );
  if (!hasScores) return null;

  return sets.map((s, idx) => {
    const tb = s.tiebreakScore;
    const hasTb = Boolean(s.isTiebreak) || Boolean(tb && ((tb.player1 ?? 0) > 0 || (tb.player2 ?? 0) > 0));
    return {
      setNumber: idx + 1,
      p1: s.player1 ?? 0,
      p2: s.player2 ?? 0,
      tiebreak: hasTb && tb ? { p1: tb.player1 ?? 0, p2: tb.player2 ?? 0 } : undefined,
    };
  });
}

export function computeSetResultsFromPoints(points: TimelinePoint[]): SetResult[] {
  if (!points || points.length === 0) return [];

  const setOrder: number[] = [];
  const pointsBySet = new Map<number, TimelinePoint[]>();

  for (const p of points) {
    if (!pointsBySet.has(p.setNumber)) {
      setOrder.push(p.setNumber);
      pointsBySet.set(p.setNumber, []);
    }
    pointsBySet.get(p.setNumber)!.push(p);
  }

  const results: SetResult[] = [];

  for (let sIdx = 0; sIdx < setOrder.length; sIdx++) {
    const setNum = setOrder[sIdx];
    const setPoints = pointsBySet.get(setNum)!;
    if (setPoints.length === 0) continue;

    const lastPoint = setPoints[setPoints.length - 1];
    const isLastSet = sIdx === setOrder.length - 1;

    // Se há um set posterior na lista de pontos, o set anterior com certeza encerrou no último ponto.
    // Se é o último set, verifica se o ponto foi definidor de game/set.
    const isGameFinished = !isLastSet || isSetDecidingPoint(lastPoint);

    if (lastPoint.isTiebreak) {
      const winner = lastPoint.winner;
      const tbP1 = (lastPoint.gameScore?.player1 ?? 0) + (winner === 'PLAYER_1' ? 1 : 0);
      const tbP2 = (lastPoint.gameScore?.player2 ?? 0) + (winner === 'PLAYER_2' ? 1 : 0);

      const lastRegular = [...setPoints].reverse().find(p => !p.isTiebreak);
      if (lastRegular) {
        const regularWinner = lastRegular.winner;
        const regP1 = lastRegular.gamesScore.player1 + (regularWinner === 'PLAYER_1' ? 1 : 0);
        const regP2 = lastRegular.gamesScore.player2 + (regularWinner === 'PLAYER_2' ? 1 : 0);
        const baseGames = Math.max(regP1, regP2);

        results.push({
          setNumber: setNum,
          p1: winner === 'PLAYER_1' ? baseGames + 1 : baseGames,
          p2: winner === 'PLAYER_2' ? baseGames + 1 : baseGames,
          tiebreak: { p1: tbP1, p2: tbP2 },
        });
      } else {
        results.push({
          setNumber: setNum,
          p1: winner === 'PLAYER_1' ? 1 : 0,
          p2: winner === 'PLAYER_2' ? 1 : 0,
          tiebreak: { p1: tbP1, p2: tbP2 },
        });
      }
    } else {
      const winner = lastPoint.winner;
      const p1 = lastPoint.gamesScore.player1 + (isGameFinished && winner === 'PLAYER_1' ? 1 : 0);
      const p2 = lastPoint.gamesScore.player2 + (isGameFinished && winner === 'PLAYER_2' ? 1 : 0);

      results.push({
        setNumber: setNum,
        p1,
        p2,
      });
    }
  }

  return results;
}

export function getSetResults(
  points: TimelinePoint[],
  scoreState?: unknown,
): SetResult[] {
  const fromState = extractSetsFromScoreState(scoreState);
  if (fromState && fromState.length > 0) {
    return fromState;
  }
  return computeSetResultsFromPoints(points);
}

export interface MatchInfoData {
  tournamentName?: string | null;
  clubName?: string | null;
  round?: string | null;
  category?: string | null;
  courtType?: string | null;
  format?: string | null;
  temperature?: number | null;
  humidity?: number | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  state?: string | null;
  details?: string | null;
  finishNote?: string | null;
}

interface MatchTimelineViewProps {
  points: TimelinePoint[];
  player1Name: string;
  player2Name: string;
  matchId: string;
  hideFilters?: boolean;
  showFinalResult?: boolean;
  scoreState?: unknown;
  matchInfo?: MatchInfoData | null;
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

export function MatchTimelineView({
  points,
  player1Name,
  player2Name,
  matchId,
  hideFilters,
  showFinalResult,
  scoreState,
  matchInfo,
  comments = [],
}: MatchTimelineViewProps) {
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
      <div className="text-center py-12 text-telemetry-text-muted text-sm">
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

          <p className="text-xs text-telemetry-text-muted mb-3">
            {hasActiveFilters
              ? `${filteredPoints.length} de ${points.length} pontos`
              : `${points.length} pontos`}
          </p>
        </>
      )}

      <div className="overflow-hidden border border-white/10 rounded-lg">
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
                <tr className="bg-telemetry-elevated border-b border-white/10">
                  <th colSpan={3} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide sticky left-0 bg-telemetry-elevated z-20 border-r border-white/10">SET</th>
                  <th colSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide border-r border-white/10">PLACAR</th>
                  <th colSpan={5} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide border-r border-white/10">1º Saque</th>
                  <th colSpan={5} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide border-r border-white/10">2º Saque</th>
                  <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide">SITUAÇÃO</th>
                  <th rowSpan={2} aria-label="TIPO (ENF, EF, W)" className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide border-l border-white/10">
                    <div className="flex flex-col leading-tight">
                      <span>TIPO</span>
                      <span className="text-[7px] font-normal text-telemetry-text-muted/50 normal-case">ENF, EF, W</span>
                    </div>
                  </th>
                  <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide">ERRO</th>
                  <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide">ONDE</th>
                  <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide">GOLPE</th>
                  <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide">EFEITO</th>
                  <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide">DIREÇÃO</th>
                  <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide">ESPECIAL</th>
                  <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide">RALLY</th>
                  <th rowSpan={2} className="px-1.5 py-1 text-center text-[9px] font-semibold text-telemetry-text-muted uppercase tracking-wide">OBS</th>
                </tr>
                <tr className="bg-telemetry-card border-b border-white/5">
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">no.</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">SAC</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase border-r border-white/10">Venc</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">GAMES</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase border-r border-white/10">PONTOS</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">ACE</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">OUT</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">NET</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">EFE</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase border-r border-white/10">DIR</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">ACE</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">OUT</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">NET</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase">EFE</th>
                  <th className="px-1 py-1 text-center text-[8px] font-semibold text-telemetry-text-muted uppercase border-r border-white/10">DIR</th>
                </tr>
              </thead>
              <tbody className="bg-transparent">
                {hasActiveFilters && filteredPoints.length === 0 && (
                  <tr><td colSpan={25} className="text-center py-6 text-telemetry-text-muted text-xs">Nenhum ponto corresponde aos filtros selecionados.</td></tr>
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
                  const setResults = getSetResults(points, scoreState);
                  return (
                    <tr className="bg-telemetry-elevated border-t border-white/10 font-bold">
                      <td colSpan={3} className="px-1.5 py-2 text-[10px] text-telemetry-text-primary sticky left-0 bg-telemetry-elevated z-10 border-r border-white/10 text-right pr-3">
                        Resultado
                      </td>
                      <td colSpan={2} className="px-1.5 py-2 text-[10px] border-r border-white/10">
                        <div className="flex flex-col leading-tight">
                          {setResults.map((sr) => (
                            <span key={sr.setNumber} className="text-telemetry-text-primary">
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

      {matchInfo && <MatchInfoLine info={matchInfo} />}

      {comments.length > 0 && (
        <div className="mt-3 bg-telemetry-alert/10 border border-telemetry-alert/20 rounded-lg px-3 py-2">
          <p className="font-semibold text-telemetry-alert text-[11px] mb-2">💬 Comentários</p>
          <div className="space-y-2">
            {[...comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((c) => (
              <div key={c.id} className="bg-telemetry-card rounded-lg px-3 py-2 border border-white/10">
                <p className="text-[11px] text-telemetry-text-primary">{c.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] text-telemetry-text-muted">{c.authorName}</span>
                  <span className="text-[9px] text-telemetry-text-muted/50">·</span>
                  <span className="text-[9px] text-telemetry-text-muted">{new Date(c.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  {c.category && (
                    <>
                      <span className="text-[9px] text-telemetry-text-muted/50">·</span>
                      <span className="text-[9px] text-telemetry-alert font-medium">{c.category}</span>
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

      <div className="mt-3 text-[10px] text-telemetry-text-muted bg-telemetry-elevated border border-white/5 rounded-lg px-3 py-2 space-y-1">
        <p className="font-semibold text-telemetry-text-primary mb-1">Como ler esta tabela</p>
        <p>Cada linha é um ponto disputado, na ordem em que aconteceu. <strong>no.</strong> = número do ponto; <strong>SAC</strong> = sacador ({player1Name}/{player2Name}); <strong>Venc</strong> = ganhador do ponto ({player1Name}/{player2Name}).</p>
        <p><strong>GAMES</strong> = placar de games/set (mostrado só no 1º ponto de cada game).</p>
        <p><strong>PONTOS</strong> = placar de pontos (15-0, Deuce, Adv. P1).</p>
        <p><strong>1º / 2º Saque</strong>: mostra ACE, OUT ou NET conforme o resultado de cada saque, além de efeito e direção. Apenas um dos saques é preenchido por ponto.</p>
        <p><strong>TIPO</strong>: <strong>Ace</strong> = Ace · <strong>DF</strong> = Dupla Falta · <strong>W</strong> = ponto vencedor direto (Winner) · <strong>ENF</strong> = Erro Não Forçado · <strong>EF</strong> = Erro Forçado</p>
        <p><strong>ERRO</strong> = tipo de erro na rede (Pass = Passada, DEV = Devolução). <strong>ONDE</strong> = onde errou (out, net).</p>
        <p><strong>SITUAÇÃO</strong> (DEV, FQ, Rede, Pass, Sq) / <strong>GOLPE</strong> (FH, BH, VFH, VBH, Sm) / <strong>EFEITO</strong> (Top, Sl, Flat) / <strong>DIREÇÃO</strong> (X, Parl, Ce, In Out, In In, Ab, Fe) descrevem como o ponto terminou.</p>
        <p><strong>ESPECIAL</strong> = golpe especial (Lob, Drop, SV, bate-pronto).</p>
        <p><strong>RALLY</strong> = faixa de bolas trocadas conforme duração marcada (3-6, 7-10, 11+).</p>
      </div>
    </div>
  );
}

function MatchInfoLine({ info }: { info: MatchInfoData }) {
  const courtTypeMap: Record<string, string> = {
    GRASS: 'Grama',
    CLAY: 'Saibro',
    HARD: 'Piso duro',
    CARPET: 'Carpete',
    INDOOR: 'Indoor',
  };

  const stateLabels: Record<string, string> = {
    FINISHED: 'Finalizada',
    IN_PROGRESS: 'Em andamento',
    SCHEDULED: 'Agendada',
    CANCELLED: 'Cancelada',
  };

  const items: Array<{ label?: string; value: string; isHighlight?: boolean }> = [];

  if (info.tournamentName) items.push({ label: 'Torneio', value: info.tournamentName });
  if (info.clubName) items.push({ label: 'Clube', value: info.clubName });
  if (info.round) items.push({ label: 'Rodada', value: info.round });
  if (info.category) items.push({ label: 'Categoria', value: info.category });
  if (info.courtType) {
    const court = courtTypeMap[info.courtType.toUpperCase()] ?? info.courtType;
    items.push({ label: 'Quadra', value: court });
  }
  if (info.format) items.push({ label: 'Formato', value: info.format.replace(/_/g, ' ') });
  if (info.temperature != null) items.push({ label: 'Temp', value: `${info.temperature}°C` });
  if (info.humidity != null) items.push({ label: 'Umidade', value: `${info.humidity}%` });
  if (info.startedAt) {
    items.push({
      label: 'Início',
      value: new Date(info.startedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    });
  }
  if (info.finishedAt) {
    items.push({
      label: 'Fim',
      value: new Date(info.finishedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    });
  }
  if (info.state) {
    items.push({ label: 'Status', value: stateLabels[info.state] ?? info.state });
  }
  if (info.details) {
    items.push({ label: 'Detalhes', value: info.details, isHighlight: true });
  }
  if (info.finishNote) {
    items.push({ label: 'Nota', value: info.finishNote });
  }

  if (items.length === 0) return null;

  return (
    <div
      data-testid="timeline-match-info"
      className="mt-3 bg-telemetry-elevated/80 border border-white/10 rounded-lg px-3 py-2 text-[11px]"
    >
      {/* Linha 1: Título */}
      <div className="font-semibold text-telemetry-text-primary text-[11px] mb-2 flex items-center gap-1.5">
        <span>ℹ️ Informações da Partida</span>
      </div>
      {/* Linhas 2 e 3: Rótulos na linha 2 e Valores na linha 3 */}
      <div className="flex items-start gap-5 overflow-x-auto whitespace-nowrap scrollbar-thin pb-1">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col shrink-0 min-w-max">
            {/* Linha 2: Rótulo */}
            <span className="text-[10px] uppercase font-semibold tracking-wider text-telemetry-text-muted">
              {item.label}
            </span>
            {/* Linha 3: Valor */}
            <span
              className={
                item.isHighlight
                  ? "text-[11px] font-bold text-telemetry-volt mt-0.5"
                  : "text-[11px] font-medium text-telemetry-text-primary mt-0.5"
              }
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}