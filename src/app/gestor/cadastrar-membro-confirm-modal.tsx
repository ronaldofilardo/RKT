'use client';

export type MemberType = 'TREINADOR' | 'ATLETA';

export interface CadastroResult {
  userId: string;
  tempPassword: string;
  linkExpiresAt: string;
  type: MemberType;
}

interface CadastrarMembroConfirmModalProps {
  open: boolean;
  result: CadastroResult | null;
  onClose: () => void;
}

export function CadastrarMembroConfirmModal({ open, result, onClose }: CadastrarMembroConfirmModalProps) {
  if (!open || !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-telemetry-card border border-telemetry-border/20 text-telemetry-text-primary rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 text-center">
        <h2 className="text-xl font-bold text-telemetry-text-primary mb-2">Cadastro concluído</h2>
        <p className="text-sm text-telemetry-text-muted mb-6">
          {result.type === 'TREINADOR' ? 'Treinador' : 'Atleta'} cadastrado com sucesso. Compartilhe a senha provisória para o primeiro acesso.
        </p>
        <div className="bg-telemetry-alert/10 border border-telemetry-alert/30 rounded-lg p-4 mb-6">
          <p className="text-xs font-medium text-telemetry-alert mb-1">Senha provisória (DDMMAAAA)</p>
          <p className="text-sm font-mono font-bold text-telemetry-alert">{result.tempPassword}</p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="bg-telemetry-blue text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-telemetry-blue/90 text-sm"
          >
            Fechar e continuar
          </button>
        </div>
      </div>
    </div>
  );
}

