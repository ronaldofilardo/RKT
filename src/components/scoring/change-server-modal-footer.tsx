interface ChangeServerModalFooterProps {
  isDoubles: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirmSingles?: () => void;
}

export function ChangeServerModalFooter({ isDoubles, isSubmitting, onClose, onConfirmSingles }: ChangeServerModalFooterProps) {
  if (!isDoubles) {
    return (
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-xs font-semibold text-telemetry-text-muted hover:bg-telemetry-elevated transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirmSingles ?? onClose}
          disabled={isSubmitting}
          className="flex-1 py-2.5 px-4 rounded-xl bg-telemetry-volt text-black text-xs font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-telemetry-volt/20 cursor-pointer"
        >
          {isSubmitting ? 'Salvando...' : 'Confirmar troca'}
        </button>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="w-full py-2.5 px-4 rounded-xl border border-white/10 text-xs font-semibold text-telemetry-text-muted hover:bg-telemetry-elevated transition-colors"
      >
        Cancelar
      </button>
    </div>
  );
}