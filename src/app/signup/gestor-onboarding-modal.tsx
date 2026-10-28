'use client';

import { validateStep1, validateStep2 } from './gestor-onboarding-logic';
import { useGestorOnboarding } from './use-gestor-onboarding';
import { ModalHeader } from './modal-header';
import { ModalError } from './modal-header';
import { GestorOnboardingStep1 } from './gestor-onboarding-step1';
import { GestorOnboardingStep2 } from './gestor-onboarding-step2';

interface GestorOnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GestorOnboardingModal({ open, onOpenChange }: GestorOnboardingModalProps) {
  const {
    step, setStep,
    form, handleChange, handleAddressChange,
    step2, handleStep2Change, handleSameAsLegalRep,
    submitting, setSubmitting, error, setError,
  } = useGestorOnboarding();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const err = step === 1 ? validateStep1(form) : validateStep2(step2);
    if (err) {
      setError(err);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        sameAsLegalRep: step2.sameAsLegalRep,
        responsibleName: step2.sameAsLegalRep ? form.legalRepName : step2.name,
        responsibleCpf: step2.sameAsLegalRep ? form.legalRepCpf : step2.cpf,
        responsibleEmail: step2.sameAsLegalRep ? form.legalRepEmail : step2.email,
        password: step2.password,
      };

      const res = await fetch('/api/auth/signup-gestor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || 'Erro ao cadastrar clube');
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
      onOpenChange(false);
    } catch {
      setError('Falha de conexão com o servidor');
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gestor-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 m-4">
        <ModalHeader step={step} onClose={() => onOpenChange(false)} />
        <ModalError error={error} />

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 ? (
            <GestorOnboardingStep1
              form={form}
              onChange={handleChange}
              onAddressChange={handleAddressChange}
              onNext={() => setStep(2)}
              submitting={submitting}
            />
          ) : (
            <GestorOnboardingStep2
              step2={step2}
              sameAsLegalRep={step2.sameAsLegalRep}
              onToggleSame={handleSameAsLegalRep}
              onChange={handleStep2Change}
              onBack={() => setStep(1)}
              submitting={submitting}
            />
          )}
        </form>
      </div>
    </div>
  );
}
