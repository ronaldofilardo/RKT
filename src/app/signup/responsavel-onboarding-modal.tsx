'use client';

import { ModalError } from './modal-header';
import { ResponsavelModalHeader } from './responsavel-modal-header';
import { ResponsavelStepMode } from './responsavel-step-mode';
import { ResponsavelStepMinor } from './responsavel-step-minor';
import { ResponsavelStepStaff } from './responsavel-step-staff';
import { useResponsavelOnboarding } from './use-responsavel-onboarding';
import type { ResponsavelSignupInput } from './responsavel-onboarding-logic';

interface ResponsavelOnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** Dados já validados do formulário principal (nome, identificador, senha). */
  credentials: ResponsavelSignupInput;
}

/** Modal de onboarding do responsável legal (A0.21): modo → menor → equipe. */
export function ResponsavelOnboardingModal({
  open,
  onOpenChange,
  onSuccess,
  credentials,
}: ResponsavelOnboardingModalProps) {
  const {
    step, setStep, accessMode, setAccessMode, minor, setMinorField, toggleConsent,
    staffIndication, setStaffIndication, inviteUrl, submitting, error, setError,
    submitMinorAccount, submitStaffIndication, finish,
  } = useResponsavelOnboarding(onSuccess);

  if (!open) return null;

  const close = () => {
    setError(null);
    onOpenChange(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="responsavel-modal-title"
    >
      <div className="bg-telemetry-card text-telemetry-text-primary border border-telemetry-border/20 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <ResponsavelModalHeader step={step} onClose={close} />
        <ModalError error={error} />

        {step === 1 && (
          <ResponsavelStepMode accessMode={accessMode} onSelect={setAccessMode} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <ResponsavelStepMinor
            minor={minor}
            onFieldChange={setMinorField}
            onToggleConsent={toggleConsent}
            onBack={() => setStep(1)}
            onSubmit={() => void submitMinorAccount(credentials)}
            submitting={submitting}
          />
        )}
        {step === 3 && (
          <ResponsavelStepStaff
            guardianName={credentials.name}
            indication={staffIndication}
            inviteUrl={inviteUrl}
            onChange={setStaffIndication}
            onSubmit={() => void submitStaffIndication()}
            onFinish={finish}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}
