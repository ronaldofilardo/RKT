'use client';

interface CadastrarMembroLinkPromptProps {
  name: string;
  type?: 'TREINADOR' | 'ATLETA';
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const copy = {
  TREINADOR: {
    subject: 'O profissional',
    action: 'Deseja vinculá-lo à equipe técnica do seu clube?',
    detail: 'Ele continuará utilizando sua senha atual e passará a ter acesso à visão deste clube.',
  },
  ATLETA: {
    subject: 'O atleta',
    action: 'Deseja vincular a conta ao seu clube?',
    detail: 'Ele continuará utilizando sua senha atual e passará a integrar o elenco deste clube.',
  },
};

export function CadastrarMembroLinkPrompt({
  name,
  type = 'TREINADOR',
  submitting,
  onCancel,
  onConfirm,
}: CadastrarMembroLinkPromptProps) {
  const texts = copy[type];
  return (
    <div className="flex flex-col gap-4 text-center">
      <div className="p-4 rounded-xl bg-telemetry-elevated/40 border border-telemetry-border/20 text-left">
        <h3 className="text-sm font-semibold text-telemetry-text-primary mb-1">
          Usuário já cadastrado no RKT
        </h3>
        <p className="text-xs text-telemetry-text-muted leading-relaxed">
          {texts.subject} <strong className="text-telemetry-text-primary">{name}</strong> já possui cadastro na plataforma. {texts.action}
        </p>
        <p className="text-[11px] text-telemetry-text-muted/80 mt-2">
          {texts.detail}
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

