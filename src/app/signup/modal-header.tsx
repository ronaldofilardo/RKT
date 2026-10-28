'use client';

interface ModalHeaderProps {
  step: 1 | 2;
  onClose: () => void;
}

export function ModalHeader({ step, onClose }: ModalHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h2 id="gestor-modal-title" className="text-xl font-bold text-gray-900">
          Cadastro de Clube / CT
        </h2>
        <p className="text-sm text-gray-500">
          {step === 1 ? 'Dados da Pessoa Jurídica' : 'Conta do Responsável'}
        </p>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>
    </div>
  );
}

interface ModalErrorProps {
  error: string | null;
}

export function ModalError({ error }: ModalErrorProps) {
  if (!error) return null;
  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
  );
}
