'use client';

import { useCallback } from 'react';
import type { GestorFormStep1 } from './gestor-onboarding-logic';
import { Step1CnpjSection } from './step1-cnpj-section';
import { Step1IdentitySection } from './step1-identity-section';
import { Step1ContactSection } from './step1-contact-section';
import { Step1AddressSection } from './step1-address-section';
import { Step1LegalRepSection } from './step1-legal-rep-section';
import { Step1SubmitSection } from './step1-submit-section';

interface Step1Props {
  form: GestorFormStep1;
  onChange: (key: keyof GestorFormStep1, value: string) => void;
  onAddressChange: (key: string, value: string) => void;
  onNext: () => void;
  submitting: boolean;
}

export function GestorOnboardingStep1({ form, onChange, onAddressChange, onNext, submitting }: Step1Props) {
  const handleChange = useCallback((key: keyof GestorFormStep1, value: string) => {
    onChange(key, value);
  }, [onChange]);

  const handleAddressChange = useCallback((key: string, value: string) => {
    onAddressChange(key, value);
  }, [onAddressChange]);

  return (
    <div className="space-y-3">
      <Step1CnpjSection form={form} onChange={handleChange} />
      <Step1IdentitySection form={form} onChange={handleChange} />
      <Step1ContactSection form={form} onChange={handleChange} />
      <Step1AddressSection form={form} onAddressChange={handleAddressChange} />
      <Step1LegalRepSection form={form} onChange={handleChange} />
      <Step1SubmitSection onNext={onNext} submitting={submitting} />
    </div>
  );
}
