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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Cadastro concluído</h2>
        <p className="text-sm text-gray-600 mb-6">
          {result.type === 'TREINADOR' ? 'Treinador' : 'Atleta'} cadastrado com sucesso. Compartilhe a senha provisória para o primeiro acesso.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-xs font-medium text-amber-600 mb-1">Senha provisória (DDMMAAAA)</p>
          <p className="text-sm font-mono font-bold text-amber-800">{result.tempPassword}</p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="bg-sky-700 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-sky-800 text-sm"
          >
            Fechar e continuar
          </button>
        </div>
      </div>
    </div>
  );
}

