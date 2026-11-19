import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { ShareIcon } from './share-spectate.icons';

interface ActionSecondaryControlsProps {
  canEdit: boolean;
  serveStep: 'none' | 'second';
  commentDisabled: boolean;
  onComment?: () => void;
  onEditScore: () => void;
  onStats?: () => void;
  onShare?: () => void;
  onClose?: () => void;
  canShare?: boolean;
}

export function ActionSecondaryControls({
  canEdit,
  serveStep,
  commentDisabled,
  onComment,
  onEditScore,
  onStats,
  onShare,
  onClose,
  canShare,
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
      {onShare && (
        <button
          type="button"
          onClick={canShare !== false ? onShare : undefined}
          disabled={canShare === false}
          className={`${btnClass} ${canShare === false ? '!opacity-30 cursor-not-allowed hover:!bg-telemetry-elevated' : ''}`}
          aria-label="Compartilhar partida"
          title={canShare === false ? 'Apenas o criador ou anotador pode compartilhar transmissão' : 'Compartilhar partida'}
        >
          <ShareIcon className="w-3.5 h-3.5 text-telemetry-text-muted hover:text-white" />
        </button>
      )}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={`${btnClass} text-red-400 hover:text-red-300 hover:bg-red-500/10`}
          aria-label="Sair da partida"
          title="Sair da partida"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      )}
    </div>
  );
}
