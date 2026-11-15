'use client';

interface ModalHeaderProps {
  step: 1 | 2;
  onClose: () => void;
}

/** Progresso por etapa (§3.4 do plano): Etapa 1 = 50%, Etapa 2 = 100%. */
const PROGRESS_BY_STEP: Record<1 | 2, number> = { 1: 50, 2: 100 };

export function ModalHeader({ step, onClose }: ModalHeaderProps) {
  const progress = PROGRESS_BY_STEP[step];

  return (
    <div className="mb-6">
      <div className="flex justify-between items-start">
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
      <div
        role="progressbar"
        aria-label="Progresso do cadastro"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        data-testid="gestor-onboarding-progress"
        className="mt-3 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden"
      >
        <div
          data-testid="gestor-onboarding-progress-fill"
          className="h-full bg-sky-600 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
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
