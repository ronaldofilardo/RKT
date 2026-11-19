import { ServeSection } from './action-bar-serve-section';
import { ActionSecondaryControls } from './action-bar-secondary-controls';

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
  aceDetailsEnabled,
  onAceDetailsToggle,
  dfDetailsEnabled,
  onDfDetailsToggle,
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
  aceDetailsEnabled?: boolean;
  onAceDetailsToggle?: () => void;
  dfDetailsEnabled?: boolean;
  onDfDetailsToggle?: () => void;
}) {
  const commentDisabled = Boolean(disabled);
  return (
    <div className="flex items-center justify-between gap-1.5 sm:gap-3 text-telemetry-text-primary">
      {/* Flanco Esquerdo: Isolamento Ergonômico de Voltar / Desfazer */}
      <div className="flex items-center flex-shrink-0">
        <button
          data-testid="undo-button"
          onClick={() => onVoltar(serveStep)}
          disabled={!canUndo || disabled}
          className="text-xs font-semibold bg-telemetry-elevated border border-white/15 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-telemetry-active active:scale-[0.97] disabled:opacity-40 min-h-[32px] sm:min-h-[34px] flex items-center gap-1 sm:gap-1.5 transition-all shadow-sm select-none whitespace-nowrap"
        >
          {processing ? '⏳' : '↩'} Voltar
        </button>
      </div>

      {/* Centro: Checkboxes de Detalhes do ACE e Detalhes da DF na mesma linha */}
      {onAceDetailsToggle && onDfDetailsToggle && (
        <div className="flex-1 flex justify-center px-1">
          <ServeSection
            aceDetailsEnabled={Boolean(aceDetailsEnabled)}
            onAceDetailsToggle={onAceDetailsToggle}
            dfDetailsEnabled={Boolean(dfDetailsEnabled)}
            onDfDetailsToggle={onDfDetailsToggle}
            disabled={disabled}
          />
        </div>
      )}

      {/* Flanco Direito: Controles Secundários Agrupados */}
      <ActionSecondaryControls
        canEdit={canEdit}
        serveStep={serveStep}
        commentDisabled={commentDisabled}
        onComment={onComment}
        onEditScore={onEditScore}
        onStats={onStats}
      />
    </div>
  );
}
