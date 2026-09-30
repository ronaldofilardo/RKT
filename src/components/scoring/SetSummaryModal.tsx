'use client';

import React, { useState, useMemo } from 'react';
import type { TimelinePoint } from '@/core/scoring/types';
import { computeSetSummary, type SetSummaryReport } from '@/core/scoring/set-summary-stats';
import { GameErrorsHistogram } from './GameErrorsHistogram';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  timelinePoints: TimelinePoint[];
  player1Name: string;
  player2Name: string;
  initialSetNumber?: number;
  completedSetsCount: number;
  isMatchFinished?: boolean;
  onViewReport?: () => void;
  completedSetsData?: Array<{
    games: Record<'player1' | 'player2', number>;
    winner: 'player1' | 'player2';
    tiebreakScore?: { player1: number; player2: number };
  }>;
}

function StatBarBilateral({
  label,
  p1Value,
  p2Value,
  p1Label,
  p2Label,
  maxReference = 100,
}: {
  label: string;
  p1Value: number;
  p2Value: number;
  p1Label: string;
  p2Label: string;
  maxReference?: number;
}) {
  const p1Width = Math.min(100, Math.max(0, (p1Value / maxReference) * 100));
  const p2Width = Math.min(100, Math.max(0, (p2Value / maxReference) * 100));

  return (
    <div className="py-2 border-b border-white/5 last:border-0">
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="font-mono font-bold text-telemetry-blue">{p1Label}</span>
        <span className="text-[11px] font-medium text-slate-300 uppercase tracking-wider">{label}</span>
        <span className="font-mono font-bold text-telemetry-error">{p2Label}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 h-2">
        {/* Barra P1 (preenche da direita para a esquerda) */}
        <div className="flex justify-end bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-telemetry-blue rounded-full transition-all duration-300"
            style={{ width: `${p1Width}%` }}
          />
        </div>
        {/* Barra P2 (preenche da esquerda para a direita) */}
        <div className="flex justify-start bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-telemetry-error rounded-full transition-all duration-300"
            style={{ width: `${p2Width}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function SetSummaryModal({
  isOpen,
  onClose,
  timelinePoints,
  player1Name,
  player2Name,
  initialSetNumber = 1,
  completedSetsCount,
  isMatchFinished = false,
  onViewReport,
  completedSetsData,
}: Props) {
  const availableSets = useMemo(() => {
    const count = Math.max(1, completedSetsCount);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [completedSetsCount]);

  const [selectedSet, setSelectedSet] = useState<number>(initialSetNumber);

  // Sincronizar se initialSetNumber mudar
  React.useEffect(() => {
    if (initialSetNumber) {
      setSelectedSet(initialSetNumber);
    }
  }, [initialSetNumber]);

  const summary = useMemo<SetSummaryReport>(() => {
    const fallback = completedSetsData && completedSetsData[selectedSet - 1]
      ? {
          player1: completedSetsData[selectedSet - 1].games.player1,
          player2: completedSetsData[selectedSet - 1].games.player2,
          tiebreakScore: completedSetsData[selectedSet - 1].tiebreakScore,
        }
      : undefined;

    return computeSetSummary(timelinePoints, selectedSet, fallback);
  }, [timelinePoints, selectedSet, completedSetsData]);

  if (!isOpen) return null;

  const p1 = summary.player1;
  const p2 = summary.player2;

  const isLastCompletedSet = selectedSet >= completedSetsCount;
  const nextSetNumber = selectedSet + 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="set-summary-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-telemetry-card border border-white/15 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-telemetry-text-primary">
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-telemetry-elevated/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-telemetry-volt px-2 py-0.5 rounded bg-telemetry-volt/10 border border-telemetry-volt/20">
                Análise do Set
              </span>
              {summary.durationMinutes && (
                <span className="text-xs text-slate-300">
                  ⏱ {summary.durationMinutes} min
                </span>
              )}
            </div>
            <h2 id="set-summary-title" className="text-lg font-bold text-white mt-1">
              Resumo do {selectedSet}º Set
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar resumo"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Abas se houver mais de um set */}
        {availableSets.length > 1 && (
          <div className="flex border-b border-white/10 bg-telemetry-elevated/40 px-3 pt-2 gap-1">
            {availableSets.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSet(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-all ${
                  selectedSet === s
                    ? 'bg-telemetry-card text-white border-t border-x border-white/15 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Set {s}
              </button>
            ))}
          </div>
        )}

        {/* Conteúdo rolável */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/10">
          {/* Card do Placar do Set */}
          <div className="bg-telemetry-elevated/60 border border-white/10 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-telemetry-blue inline-block" />
              <span className="font-bold text-sm text-slate-100">{player1Name}</span>
            </div>
            <div className="flex items-center gap-2 text-xl font-mono font-black">
              <span className={summary.winner === 'player1' ? 'text-telemetry-volt' : 'text-slate-200'}>
                {summary.score.player1}
              </span>
              <span className="text-slate-400 text-sm">×</span>
              <span className={summary.winner === 'player2' ? 'text-telemetry-volt' : 'text-slate-200'}>
                {summary.score.player2}
              </span>
              {summary.score.tiebreakScore && (
                <span className="text-xs text-slate-400 font-sans ml-1">
                  ({Math.min(summary.score.tiebreakScore.player1, summary.score.tiebreakScore.player2)})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100">{player2Name}</span>
              <span className="w-3 h-3 rounded-full bg-telemetry-error inline-block" />
            </div>
          </div>

          {/* Seção 1: Saque e Eficiência */}
          <div className="bg-telemetry-elevated/40 border border-white/10 rounded-xl p-3.5 space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Saque & Eficiência
            </h3>
            <StatBarBilateral
              label="1º Serviço em Quadra"
              p1Value={p1.firstServePct}
              p2Value={p2.firstServePct}
              p1Label={`${p1.firstServePct}% (${p1.firstServesIn}/${p1.totalServicePoints})`}
              p2Label={`${p2.firstServePct}% (${p2.firstServesIn}/${p2.totalServicePoints})`}
            />
            <StatBarBilateral
              label="Pontos com 1º Saque"
              p1Value={p1.firstServePointsWonPct}
              p2Value={p2.firstServePointsWonPct}
              p1Label={`${p1.firstServePointsWonPct}%`}
              p2Label={`${p2.firstServePointsWonPct}%`}
            />

            {/* Aces e Duplas Faltas */}
            <div className="grid grid-cols-2 gap-2 pt-2 mt-2 border-t border-white/5">
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-[11px] text-slate-400 uppercase font-semibold mb-1">Aces</div>
                <div className="flex justify-around items-center font-mono font-bold text-sm">
                  <span className="text-telemetry-blue">{p1.aces}</span>
                  <span className="text-slate-400 text-xs">vs</span>
                  <span className="text-telemetry-error">{p2.aces}</span>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-[11px] text-slate-400 uppercase font-semibold mb-1">Duplas Faltas</div>
                <div className="flex justify-around items-center font-mono font-bold text-sm">
                  <span className="text-telemetry-blue">{p1.doubleFaults}</span>
                  <span className="text-slate-400 text-xs">vs</span>
                  <span className="text-telemetry-error">{p2.doubleFaults}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Break Points */}
          <div className="bg-telemetry-elevated/40 border border-white/10 rounded-xl p-3.5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Break Points
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-[11px] text-slate-400 font-medium mb-1">Convertidos (Devolução)</div>
                <div className="flex justify-around items-center font-mono text-xs">
                  <span className="font-bold text-telemetry-blue">
                    {p1.breakPointsConverted}/{p1.breakPointsOpportunities} ({p1.breakPointsConvertedPct}%)
                  </span>
                  <span className="font-bold text-telemetry-error">
                    {p2.breakPointsConverted}/{p2.breakPointsOpportunities} ({p2.breakPointsConvertedPct}%)
                  </span>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-[11px] text-slate-400 font-medium mb-1">Salvos (Saque)</div>
                <div className="flex justify-around items-center font-mono text-xs">
                  <span className="font-bold text-telemetry-blue">
                    {p1.breakPointsSaved}/{p1.breakPointsFaced} ({p1.breakPointsSavedPct}%)
                  </span>
                  <span className="font-bold text-telemetry-error">
                    {p2.breakPointsSaved}/{p2.breakPointsFaced} ({p2.breakPointsSavedPct}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 3: Histograma de Erros por Game */}
          <div className="bg-telemetry-elevated/40 border border-white/10 rounded-xl p-3.5">
            <GameErrorsHistogram
              gameErrors={summary.gameErrors}
              player1Name={player1Name}
              player2Name={player2Name}
            />
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-telemetry-elevated flex flex-col sm:flex-row items-center justify-between gap-2">
          {isMatchFinished ? (
            <>
              {onViewReport && (
                <button
                  type="button"
                  onClick={onViewReport}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-telemetry-elevated border border-white/20 text-slate-200 hover:text-white hover:bg-white/10 text-xs font-semibold transition-all"
                >
                  Ver Relatório Completo
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-telemetry-volt text-black font-bold text-xs uppercase tracking-wide hover:opacity-90 transition-opacity"
              >
                Concluir Anotação
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 text-xs font-semibold transition-all"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-telemetry-volt text-black font-bold text-xs uppercase tracking-wide hover:opacity-90 shadow-lg shadow-telemetry-volt/20 transition-all flex items-center justify-center gap-1.5"
              >
                {isLastCompletedSet ? `Prosseguir para o Set ${nextSetNumber} →` : 'Continuar Anotação'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
