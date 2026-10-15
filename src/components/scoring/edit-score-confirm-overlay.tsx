'use client';

interface EditScoreConfirmOverlayProps {
  isConfirming: boolean;
}

/** Overlay de confirmação ("Salvando placar...") sobre o modal de edição. */
export function EditScoreConfirmOverlay({ isConfirming }: EditScoreConfirmOverlayProps) {
  if (!isConfirming) return null;

  return (
    <div className="absolute inset-0 z-10 bg-black/60 flex items-center justify-center rounded-2xl">
      <div className="flex items-center gap-3 px-6 py-3 bg-telemetry-elevated border border-white/10 rounded-xl shadow-lg">
        <svg className="animate-spin h-5 w-5 text-telemetry-volt" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm font-medium text-telemetry-text-primary">Salvando placar...</span>
      </div>
    </div>
  );
}
