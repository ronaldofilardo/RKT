'use client';

import type { UserSearchResult } from './types';

interface EmitirSenhaConfirmStepProps {
  selected: UserSearchResult;
  loading: boolean;
  onBack: () => void;
  onIssue: () => void;
}

/** Passo 2 — confirmação do usuário selecionado. */
export function EmitirSenhaConfirmStep({ selected, loading, onBack, onIssue }: EmitirSenhaConfirmStepProps) {
  return (
    <div className="space-y-4">
      <div className="bg-telemetry-elevated/40 border border-telemetry-border/20 rounded-xl p-4 space-y-1">
        <p className="text-sm font-semibold text-telemetry-text-primary">{selected.name}</p>
        <p className="text-xs text-telemetry-text-muted">{selected.email}</p>
        <p className="text-xs text-telemetry-text-muted">Perfil: {selected.role}</p>
      </div>
      <p className="text-xs text-telemetry-text-muted">
        Será gerado um link de redefinição válido por <strong>7 dias</strong>. O usuário deverá trocar a senha no primeiro acesso.
      </p>
      <div className="flex gap-2 justify-end">
        <button onClick={onBack} className="px-4 py-2 text-sm text-telemetry-text-muted hover:text-telemetry-text-primary transition-colors">
          Voltar
        </button>
        <button
          onClick={onIssue}
          disabled={loading}
          className="px-4 py-2 bg-telemetry-blue text-white text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-telemetry-blue/80 transition-colors"
        >
          {loading ? 'Gerando...' : 'Confirmar e gerar link'}
        </button>
      </div>
    </div>
  );
}

interface EmitirSenhaDoneStepProps {
  token: string;
  expiresAt: string;
  onClose: () => void;
  onCopy: () => void;
}

/** Passo 3 — link gerado, com cópia e validade. */
export function EmitirSenhaDoneStep({ token, expiresAt, onClose, onCopy }: EmitirSenhaDoneStepProps) {
  return (
    <div className="space-y-4">
      <div className="bg-telemetry-volt/10 border border-telemetry-volt/30 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-telemetry-volt uppercase tracking-wide">Link gerado com sucesso</p>
        <p className="text-xs text-telemetry-text-muted break-all font-mono">
          {`${typeof window !== 'undefined' ? window.location.origin : ''}/redefinir-senha?token=${token}`}
        </p>
        {expiresAt && (
          <p className="text-xs text-telemetry-text-muted">
            Válido até: {new Date(expiresAt).toLocaleString('pt-BR')}
          </p>
        )}
      </div>
      <p className="text-xs text-telemetry-text-muted">
        Envie este link para o usuário. Ele só pode ser usado uma vez e expira em 7 dias.
      </p>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 text-sm text-telemetry-text-muted hover:text-telemetry-text-primary transition-colors">
          Fechar
        </button>
        <button
          onClick={onCopy}
          className="px-4 py-2 bg-telemetry-blue text-white text-sm font-medium rounded-lg hover:bg-telemetry-blue/80 transition-colors"
        >
          Copiar link
        </button>
      </div>
    </div>
  );
}
