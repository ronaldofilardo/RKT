'use client';

import { useState, useCallback } from 'react';
import type { GestorFormStep1, GestorFormStep2 } from './gestor-onboarding-logic';
import { initialStep1, initialStep2 } from './gestor-onboarding-logic';

export function useGestorOnboarding() {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<GestorFormStep1>(initialStep1);
  const [step2, setStep2] = useState<GestorFormStep2>(initialStep2);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback((key: keyof GestorFormStep1, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleAddressChange = useCallback((key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      endereco: { ...prev.endereco, [key]: value },
    }));
  }, []);

  const handleStep2Change = useCallback((key: string, value: string) => {
    setStep2((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSameAsLegalRep = useCallback(() => {
    setStep2((prev) => {
      const same = !prev.sameAsLegalRep;
      if (same) {
        return {
          ...prev,
          same: true,
          name: form.legalRepName,
          cpf: form.legalRepCpf,
          email: form.legalRepEmail,
        };
      }
      return { ...prev, same: false, name: '', cpf: '', email: '' };
    });
  }, [form.legalRepName, form.legalRepCpf, form.legalRepEmail]);

  return {
    step, setStep,
    form, setForm,
    step2, setStep2,
    submitting, setSubmitting,
    error, setError,
    handleChange,
    handleAddressChange,
    handleStep2Change,
    handleSameAsLegalRep,
  };
}
