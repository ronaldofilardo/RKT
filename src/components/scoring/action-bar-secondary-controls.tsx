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
  const btnClass = 'min-h-[25px] min-w-[25px] sm:min-h-[27px] sm:min-w-[27px] flex items-center justify-center bg-telemetry-elevated border border-white/10 p-0.5 rounded-md hover:bg-telemetry-active active:scale-[0.97] disabled:opacity-40 transition-all text-[11px] sm:text-xs';

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 p-0.5 rounded-md bg-white/[0.03] border border-white/10 flex-shrink-0">
      <ThemeToggleButton className="!min-h-[25px] !min-w-[25px] sm:!min-h-[27px] sm:!min-w-[27px] !p-0.5 !text-[11px] sm:!text-xs" />
      {onComment && (
        <button
          onClick={onComment}
          disabled={commentDisabled}
          className={btnClass}
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
          className={btnClass}
        >
          ✏️<span className="sr-only">Corrigir</span>
        </button>
      )}
      {onStats && (
        <button
          onClick={onStats}
          className={btnClass}
          aria-label="Ver estatísticas"
        >
          📊
        </button>
      )}
    </div>
  );
}
