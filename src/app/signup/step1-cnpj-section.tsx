'use client';

import { useCallback } from 'react';
import type { GestorFormStep1 } from './gestor-onboarding-logic';
import { FormField } from '@/components/ui/form-field';
import { maskCnpj } from '@/lib/validators/masks';
import { validateCnpjField } from '@/lib/validators/field-validators';

interface Step1CnpjSectionProps {
  form: GestorFormStep1;
  onChange: (key: keyof GestorFormStep1, value: string) => void;
}

export function Step1CnpjSection({ form, onChange }: Step1CnpjSectionProps) {
  const handleChange = useCallback((value: string) => {
    onChange('cnpj', value);
  }, [onChange]);

  return (
    <div className="space-y-3">
      <FormField
        id="gestor-cnpj"
        label="CNPJ"
        placeholder="00.000.000/0000-00"
        value={form.cnpj}
        onChange={handleChange}
        mask={maskCnpj}
        validate={validateCnpjField}
      />
    </div>
  );
}
