'use client';

import {
  validateMinor,
  type ResponsavelMinorForm,
  type ResponsavelPurpose,
} from './responsavel-onboarding-logic';
import { ResponsavelMinorFields } from './responsavel-minor-fields';
import { ResponsavelConsentTriad } from './responsavel-consent-triad';

interface ResponsavelStepMinorProps {
  minor: ResponsavelMinorForm;
  onFieldChange: <K extends keyof ResponsavelMinorForm>(key: K, value: ResponsavelMinorForm[K]) => void;
  onToggleConsent: (purpose: ResponsavelPurpose) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

const BUTTON_BASE =
  'flex-1 font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50 transition-colors cursor-pointer';

export function ResponsavelStepMinor({
  minor,
  onFieldChange,
  onToggleConsent,
  onBack,
  onSubmit,
  submitting,
}: ResponsavelStepMinorProps) {
  const validationError = validateMinor(minor);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-telemetry-text-primary">Dados do menor dependente</h3>
        <p className="text-xs text-telemetry-text-muted mt-1">
          Informe os dados para criação da ficha esportiva do menor.
        </p>
      </div>

      <ResponsavelMinorFields minor={minor} onFieldChange={onFieldChange} />
      <ResponsavelConsentTriad
        purposes={minor.purposes}
        declaration={minor.declaration}
        onToggle={onToggleConsent}
        onToggleDeclaration={(val) => onFieldChange('declaration', val)}
      />

      {validationError && (
        <p role="alert" className="text-xs text-telemetry-error">
          {validationError}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className={`${BUTTON_BASE} border border-telemetry-border/30 bg-telemetry-elevated/40 text-telemetry-text-primary hover:bg-telemetry-elevated/70`}
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className={`${BUTTON_BASE} bg-telemetry-blue hover:bg-telemetry-blue-light text-white shadow-sm`}
        >
          {submitting ? 'Criando conta...' : 'Criar conta'}
        </button>
      </div>
    </div>
  );
}
