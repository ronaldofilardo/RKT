'use client';

interface CadastrarMembroLinkPromptProps {
  name: string;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CadastrarMembroLinkPrompt({
  name,
  submitting,
  onCancel,
  onConfirm,
}: CadastrarMembroLinkPromptProps) {
  return (
    <div className="flex flex-col gap-4 text-center">
      <div className="p-4 rounded-xl bg-telemetry-elevated/40 border border-telemetry-border/20 text-left">
        <h3 className="text-sm font-semibold text-telemetry-text-primary mb-1">
          Usuário já cadastrado no RKT
        </h3>
        <p className="text-xs text-telemetry-text-muted leading-relaxed">
          O profissional <strong className="text-telemetry-text-primary">{name}</strong> já possui cadastro na plataforma. Deseja vinculá-lo à equipe técnica do seu clube?
        </p>
        <p className="text-[11px] text-telemetry-text-muted/80 mt-2">
          Ele continuará utilizando sua senha atual e passará a ter acesso à visão deste clube.
        </p>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-3.5 py-2 text-xs font-medium text-telemetry-text-muted hover:text-telemetry-text-primary cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={onConfirm}
          className="px-4 py-2 text-xs bg-telemetry-blue hover:bg-telemetry-blue-light text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          {submitting ? 'Vinculando...' : 'Confirmar Vínculo'}
        </button>
      </div>
    </div>
  );
}

