import type { ServerEffectContext, ServeStep } from './server-effect-modal.types';

interface ServerEffectModalFooterProps {
  context: ServerEffectContext;
  serveStep: ServeStep;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ServerEffectModalFooter({ context, serveStep, onConfirm, onCancel }: ServerEffectModalFooterProps) {
  return (
    <div className="px-5 py-4 border-t border-white/10 flex flex-col gap-2 bg-black/10">
      <button
        onClick={onConfirm}
        className="w-full py-2.5 rounded-xl font-bold transition-all text-sm bg-telemetry-blue hover:bg-telemetry-active text-white shadow-lg border border-white/10"
      >
        {context === 'winner'
          ? 'Confirmar Ponto'
          : serveStep === 'first'
            ? 'Registrar e Continuar'
            : 'Registrar Dupla Falta'}
      </button>
      <button
        onClick={onCancel}
        className="w-full py-2.5 rounded-xl font-bold text-sm bg-transparent text-telemetry-alert border border-telemetry-alert/60 hover:bg-telemetry-alert/10 hover:border-telemetry-alert transition-all"
      >
        Cancelar
      </button>
    </div>
  );
}
