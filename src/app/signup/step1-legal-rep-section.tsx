'use client';

import { useCallback } from 'react';
import type { GestorFormStep1 } from './gestor-onboarding-logic';
import { FormField } from '@/components/ui/form-field';
import { maskCpf, maskPhone } from '@/lib/validators/masks';
import { validateCpfField, validateEmailField, validatePhoneField } from '@/lib/validators/field-validators';

interface Step1LegalRepSectionProps {
  form: GestorFormStep1;
  onChange: (key: keyof GestorFormStep1, value: string) => void;
}

export function Step1LegalRepSection({ form, onChange }: Step1LegalRepSectionProps) {
  const handleKey = useCallback((key: keyof GestorFormStep1, value: string) => {
    onChange(key, value);
  }, [onChange]);

  return (
    <div className="space-y-3 pt-4 border-t">
      <span className="text-sm font-medium text-gray-700">Representante Legal</span>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          id="gestor-legal-rep-nome"
          label="Nome completo"
          placeholder="Nome do representante"
          value={form.legalRepName}
          onChange={(v) => handleKey('legalRepName', v)}
        />
        <FormField
          id="gestor-legal-rep-cpf"
          label="CPF"
          placeholder="000.000.000-00"
          value={form.legalRepCpf}
          onChange={(v) => handleKey('legalRepCpf', v)}
          mask={maskCpf}
          validate={validateCpfField}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          id="gestor-legal-rep-email"
          type="email"
          label="E-mail"
          placeholder="email@representante.com"
          value={form.legalRepEmail}
          onChange={(v) => handleKey('legalRepEmail', v)}
          validate={validateEmailField}
        />
        <FormField
          id="gestor-legal-rep-telefone"
          type="tel"
          label="Telefone"
          placeholder="(00) 00000-0000"
          value={form.legalRepPhone}
          onChange={(v) => handleKey('legalRepPhone', v)}
          mask={maskPhone}
          validate={validatePhoneField}
        />
      </div>
    </div>
  );
}
