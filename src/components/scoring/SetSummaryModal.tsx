'use client';

import React, { useState, useMemo } from 'react';
import type { TimelinePoint } from '@/core/scoring/types';
import { computeSetSummary, type SetSummaryReport } from '@/core/scoring/set-summary-stats';
import { GameErrorsHistogram } from './GameErrorsHistogram';
import { SetSummaryStatsSections } from './set-summary-stats-sections';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onResumeMatch?: () => void;
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

export function SetSummaryModal({
  isOpen,
  onClose,
  onResumeMatch,
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
                <span className="text-xs text-telemetry-text-muted">
                  ⏱ {summary.durationMinutes} min
                </span>
              )}
            </div>
            <h2 id="set-summary-title" className="text-lg font-bold text-telemetry-text-primary mt-1">
              Resumo do {selectedSet}º Set
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar resumo"
            className="p-1.5 rounded-lg text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-telemetry-elevated transition-colors"
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
                    ? 'bg-telemetry-card text-telemetry-text-primary border-t border-x border-white/15 shadow-sm'
                    : 'text-telemetry-text-muted hover:text-telemetry-text-primary'
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
              <span className="font-bold text-sm text-telemetry-text-primary">{player1Name}</span>
            </div>
            <div className="flex items-center gap-2 text-xl font-mono font-black">
              <span className={summary.winner === 'player1' ? 'text-telemetry-volt' : 'text-telemetry-text-primary'}>
                {summary.score.player1}
              </span>
              <span className="text-telemetry-text-muted text-sm">×</span>
              <span className={summary.winner === 'player2' ? 'text-telemetry-volt' : 'text-telemetry-text-primary'}>
                {summary.score.player2}
              </span>
              {summary.score.tiebreakScore && (
                <span className="text-xs text-telemetry-text-muted font-sans ml-1">
                  ({Math.min(summary.score.tiebreakScore.player1, summary.score.tiebreakScore.player2)})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-telemetry-text-primary">{player2Name}</span>
              <span className="w-3 h-3 rounded-full bg-telemetry-error inline-block" />
            </div>
          </div>

          <SetSummaryStatsSections p1={p1} p2={p2} />

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
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-telemetry-elevated border border-white/20 text-telemetry-text-primary hover:bg-white/10 text-xs font-semibold transition-all"
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
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-white/10 text-xs font-semibold transition-all"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={onResumeMatch ?? onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-telemetry-volt text-black font-bold text-xs uppercase tracking-wide hover:opacity-90 shadow-lg shadow-telemetry-volt/20 transition-all flex items-center justify-center gap-1.5"
              >
                {onResumeMatch ? 'Partida →' : (isLastCompletedSet ? `Prosseguir para o Set ${nextSetNumber} →` : 'Continuar Anotação')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
