'use client';

import { useCallback } from 'react';
import type { GestorFormStep2 } from './gestor-onboarding-logic';
import { Step2Checkbox } from './step2-checkbox';
import { Step2ResponsibleFields } from './step2-responsible-fields';
import { Step2PasswordFields } from './step2-password-fields';
import { Step2Actions } from './step2-actions';

interface Step2Props {
  step2: GestorFormStep2;
  sameAsLegalRep: boolean;
  onToggleSame: () => void;
  onChange: (key: string, value: string) => void;
  onBack: () => void;
  submitting: boolean;
}

export function GestorOnboardingStep2({ step2, sameAsLegalRep, onToggleSame, onChange, onBack, submitting }: Step2Props) {
  const handleChange = useCallback((key: string, value: string) => {
    onChange(key, value);
  }, [onChange]);

  const disabledFields = sameAsLegalRep;

  return (
    <div className="space-y-3">
      <Step2Checkbox step2={step2} onToggleSame={onToggleSame} />
      <Step2ResponsibleFields step2={step2} disabledFields={disabledFields} onChange={handleChange} />
      <Step2PasswordFields step2={step2} onChange={handleChange} />
      <Step2Actions onBack={onBack} submitting={submitting} />
    </div>
  );
}
