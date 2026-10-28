'use client';

import { useCallback } from 'react';
import type { GestorFormStep1 } from './gestor-onboarding-logic';

interface Step1CnpjSectionProps {
  form: GestorFormStep1;
  onChange: (key: keyof GestorFormStep1, value: string) => void;
}

export function Step1CnpjSection({ form, onChange }: Step1CnpjSectionProps) {
  const handleChange = useCallback((key: keyof GestorFormStep1, value: string) => {
    onChange(key, value);
  }, [onChange]);

  return (
    <div className="space-y-3">
      <label htmlFor="gestor-cnpj" className="text-sm font-medium text-gray-700">CNPJ</label>
      <input
        id="gestor-cnpj"
        type="text"
        placeholder="00.000.000/0000-00"
        value={form.cnpj}
        onChange={(e) => handleChange('cnpj', e.target.value)}
        className="w-full border rounded-lg p-2.5 text-sm"
      />
    </div>
  );
}
