'use client';

import { useCallback } from 'react';
import type { GestorFormStep2 } from './gestor-onboarding-logic';
import { FormField } from '@/components/ui/form-field';
import { maskCpf } from '@/lib/validators/masks';
import { validateCpfField, validateEmailField } from '@/lib/validators/field-validators';

interface Step2ResponsibleFieldsProps {
  step2: GestorFormStep2;
  disabledFields: boolean;
  onChange: (key: string, value: string) => void;
}

export function Step2ResponsibleFields({ step2, disabledFields, onChange }: Step2ResponsibleFieldsProps) {
  const handleChange = useCallback((key: string, value: string) => {
    onChange(key, value);
  }, [onChange]);

  if (step2.sameAsLegalRep) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          id="gestor-responsavel-nome"
          label="Nome completo"
          placeholder="Nome do responsável"
          value={step2.name}
          onChange={(v) => handleChange('name', v)}
          disabled={disabledFields}
        />
        <FormField
          id="gestor-responsavel-cpf"
          label="CPF"
          placeholder="000.000.000-00"
          value={step2.cpf}
          onChange={(v) => handleChange('cpf', v)}
          mask={maskCpf}
          validate={validateCpfField}
          disabled={disabledFields}
        />
      </div>
      <div>
        <FormField
          id="gestor-responsavel-email"
          type="email"
          label="E-mail"
          placeholder="email@responsavel.com"
          value={step2.email}
          onChange={(v) => handleChange('email', v)}
          validate={validateEmailField}
          disabled={disabledFields}
        />
      </div>
    </>
  );
}
