'use client';

interface CadastrarMembroLinkPromptProps {
  name: string;
  type?: 'TREINADOR' | 'ATLETA';
  submitting: boolean;
  accountKind?: string;
  guardianName?: string;
  message?: string;
  canLink?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const copy = {
  TREINADOR: {
    action: 'Quer adicioná-lo como treinador?',
    detail: 'Ele mantém a senha atual e ganha acesso a este clube.',
  },
  ATLETA: {
    action: 'Quer adicioná-lo ao elenco?',
    detail: 'Ele mantém a senha atual e ganha acesso a este clube.',
  },
};

export function CadastrarMembroLinkPrompt({
  name,
  type = 'TREINADOR',
  submitting,
  accountKind,
  guardianName,
  message,
  canLink = true,
  onCancel,
  onConfirm,
}: CadastrarMembroLinkPromptProps) {
  const isMinor = accountKind === 'MINOR_WITH_GUARDIAN' || accountKind === 'DEPENDENT_PLAYER_WITHOUT_USER';
  const isGuardian = accountKind === 'GUARDIAN_USER';
  const texts = copy[type] ?? copy.ATLETA;

  return (
    <div className="flex flex-col gap-4 text-center">
      <div className={`p-4 rounded-xl border text-left ${
        isGuardian
          ? 'bg-red-500/10 border-red-500/30 text-red-300'
          : isMinor
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          : 'bg-telemetry-elevated/40 border-telemetry-border/20'
      }`}>
        <h3 className="text-sm font-semibold text-telemetry-text-primary mb-1">
          {isGuardian
            ? 'CPF de Responsável Legal'
            : isMinor
            ? 'Atleta Menor Sob Tutela Legal'
            : `${name} já tem uma conta no RKT`}
        </h3>
        <p className="text-xs text-telemetry-text-muted leading-relaxed">
          {isGuardian ? (
            message || 'Este CPF pertence a um responsável legal e não pode ser vinculado como atleta.'
          ) : isMinor ? (
            message || `Atleta menor sob tutela de ${guardianName || 'responsável legal'}. O vínculo com seu clube ficará pendente de aprovação do responsável.`
          ) : (
            <>
              <strong className="text-telemetry-text-primary">{name}</strong> já tem conta no RKT. {texts.action}
            </>
          )}
        </p>
        {!isMinor && !isGuardian && (
          <p className="text-[11px] text-telemetry-text-muted/80 mt-2">
            {texts.detail}
          </p>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-3.5 py-2 text-xs font-medium text-telemetry-text-muted hover:text-telemetry-text-primary cursor-pointer"
        >
          {canLink ? 'Cancelar' : 'Fechar'}
        </button>
        {canLink && (
          <button
            type="button"
            disabled={submitting}
            onClick={onConfirm}
            className="px-4 py-2 text-xs bg-telemetry-blue hover:bg-telemetry-blue-light text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Processando...' : isMinor ? 'Solicitar Vínculo' : 'Sim, vincular'}
          </button>
        )}
      </div>
    </div>
  );
}
