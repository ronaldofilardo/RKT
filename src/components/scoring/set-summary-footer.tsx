'use client';

interface SetSummaryFooterProps {
  isMatchFinished: boolean;
  onViewReport?: () => void;
  onResumeMatch?: () => void;
  isLastCompletedSet: boolean;
  nextSetNumber: number;
  onClose: () => void;
}

/** Rodapé do modal: concluir/ver relatório quando finalizado, ou fechar/retomar. */
export function SetSummaryFooter({
  isMatchFinished,
  onViewReport,
  onResumeMatch,
  isLastCompletedSet,
  nextSetNumber,
  onClose,
}: SetSummaryFooterProps) {
  return (
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
  );
}
