interface ServerEffectCloseDialogProps {
  onDiscard: () => void;
  onContinue: () => void;
}

export function ServerEffectCloseDialog({ onDiscard, onContinue }: ServerEffectCloseDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      role="button"
      tabIndex={-1}
      aria-label="Fechar diálogo"
      onClick={onDiscard}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || e.key === 'Enter') onDiscard();
      }}
    >
      <div
        className="bg-telemetry-card rounded-2xl p-6 mx-4 w-[clamp(240px,70vw,360px)] shadow-2xl border border-white/10"
        role="dialog"
        aria-label="Confirmar descarte"
        tabIndex={-1}
      >
        <p className="text-telemetry-text-primary font-semibold text-center mb-4">Descartar detalhes do saque?</p>
        <div className="flex gap-3">
          <button
            onClick={onDiscard}
            className="flex-1 py-2.5 rounded-xl bg-telemetry-alert/20 text-telemetry-alert font-bold border border-telemetry-alert/30 hover:bg-telemetry-alert/30 transition-all"
          >
            Descartar
          </button>
          <button
            onClick={onContinue}
            className="flex-1 py-2.5 rounded-xl bg-telemetry-elevated text-telemetry-text-primary font-bold border border-white/10 hover:bg-telemetry-active transition-all"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
