import { ThemeToggleButton } from '@/components/ThemeToggleButton';

interface ActionSecondaryControlsProps {
  canEdit: boolean;
  serveStep: 'none' | 'second';
  commentDisabled: boolean;
  onComment?: () => void;
  onEditScore: () => void;
  onStats?: () => void;
}

export function ActionSecondaryControls({
  canEdit,
  serveStep,
  commentDisabled,
  onComment,
  onEditScore,
  onStats,
}: ActionSecondaryControlsProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/10 flex-shrink-0">
      <ThemeToggleButton />
      {onComment && (
        <button
          onClick={onComment}
          disabled={commentDisabled}
          className="min-h-[38px] min-w-[38px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center bg-telemetry-elevated border border-white/10 p-1.5 sm:p-2 rounded-lg hover:bg-telemetry-active active:scale-[0.97] disabled:opacity-40 transition-all text-sm"
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
          className="min-h-[38px] min-w-[38px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center bg-telemetry-elevated border border-white/10 p-1.5 sm:p-2 rounded-lg hover:bg-telemetry-active active:scale-[0.97] disabled:opacity-40 transition-all text-sm"
        >
          ✏️<span className="sr-only">Corrigir</span>
        </button>
      )}
      {onStats && (
        <button
          onClick={onStats}
          className="min-h-[38px] min-w-[38px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center bg-telemetry-elevated border border-white/10 p-1.5 sm:p-2 rounded-lg hover:bg-telemetry-active active:scale-[0.97] transition-all text-sm"
          aria-label="Ver estatísticas"
        >
          📊
        </button>
      )}
    </div>
  );
}
