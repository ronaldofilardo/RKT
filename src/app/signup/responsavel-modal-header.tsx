'use client';

import type { ResponsavelStep } from './use-responsavel-onboarding';

interface ResponsavelModalHeaderProps {
  step: ResponsavelStep;
  onClose: () => void;
}

const STEP_SUBTITLE = ['Modo de acesso', 'Dados do menor', 'Equipe técnica'];

/** Cabeçalho + barra de progresso do modal de responsável (3 etapas). */
export function ResponsavelModalHeader({ step, onClose }: ResponsavelModalHeaderProps) {
  const progress = step * 33;

  return (
    <div className="mb-5">
      <div className="flex justify-between items-start">
        <div>
          <h2 id="responsavel-modal-title" className="text-xl font-bold text-telemetry-text-primary">
            Cadastro de Responsável Legal
          </h2>
          <p className="text-xs text-telemetry-text-muted mt-0.5">
            {step}. {STEP_SUBTITLE[step - 1]}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar modal"
          className="text-telemetry-text-muted hover:text-telemetry-text-primary p-1 rounded-lg transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>
      <div
        role="progressbar"
        aria-label="Progresso do cadastro de responsável"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        data-testid="responsavel-onboarding-progress"
        className="mt-3 h-1.5 w-full bg-telemetry-elevated border border-telemetry-border/20 rounded-full overflow-hidden"
      >
        <div
          data-testid="responsavel-onboarding-progress-fill"
          className="h-full bg-telemetry-blue rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
