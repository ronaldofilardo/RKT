import { ThemeToggleButton } from '@/components/ThemeToggleButton';

export function ActionFooter({
  canUndo,
  canEdit,
  onVoltar,
  serveStep,
  onFontSmaller: _onFontSmaller,
  onFontBigger: _onFontBigger,
  onEditScore,
  onComment,
  onStats,
  fontScale: _fontScale,
  disabled,
  processing,
}: {
  canUndo: boolean;
  canEdit: boolean;
  onVoltar: (serveStep: 'none' | 'second') => void;
  serveStep: 'none' | 'second';
  onFontSmaller?: () => void;
  onFontBigger?: () => void;
  onEditScore: () => void;
  onComment?: () => void;
  onStats?: () => void;
  fontScale?: number;
  disabled: boolean;
  processing?: boolean;
}) {
  const commentDisabled = Boolean(disabled);
  return (
    <div className="flex items-center justify-between gap-2 text-telemetry-text-primary pt-0.5">
      {/* Flanco Esquerdo: Isolamento Ergonômico de Voltar / Desfazer */}
      <div className="flex items-center">
        <button
          data-testid="undo-button"
          onClick={() => onVoltar(serveStep)}
          disabled={!canUndo || disabled}
          className="text-xs sm:text-sm font-semibold bg-telemetry-elevated border border-white/15 px-3 sm:px-3.5 py-2 rounded-xl hover:bg-telemetry-active active:scale-[0.97] disabled:opacity-40 min-h-[44px] flex items-center gap-1.5 transition-all shadow-sm select-none"
        >
          {processing ? '⏳' : '↩'} Voltar
        </button>
      </div>

      {/* Flanco Direito: Controles Secundários Agrupados */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/10">
        <ThemeToggleButton />
        {onComment && (
          <button
            onClick={onComment}
            disabled={commentDisabled}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center bg-telemetry-elevated border border-white/10 p-2 rounded-lg hover:bg-telemetry-active active:scale-[0.97] disabled:opacity-40 transition-all"
            aria-label="Adicionar comentário"
          >
            💬
          </button>
        )}
        {canEdit && (
          <button
            data-testid="edit-score-button"
            aria-label="Corrigir placar"
            onClick={onEditScore}
            disabled={serveStep === 'second'}
            title={
              serveStep === 'second'
                ? 'Finalize a anotação do 2º saque antes de editar o placar'
                : 'Corrigir placar'
            }
            className="min-h-[40px] min-w-[40px] flex items-center justify-center bg-telemetry-elevated border border-white/10 p-2 rounded-lg hover:bg-telemetry-active active:scale-[0.97] disabled:opacity-40 transition-all"
          >
            ✏️<span className="sr-only">Corrigir</span>
          </button>
        )}
        {onStats && (
          <button
            onClick={onStats}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center bg-telemetry-elevated border border-white/10 p-2 rounded-lg hover:bg-telemetry-active active:scale-[0.97] transition-all"
            aria-label="Ver estatísticas"
          >
            📊
          </button>
        )}
      </div>
    </div>
  );
}
