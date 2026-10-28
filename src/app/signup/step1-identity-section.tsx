'use client';

import { useCallback } from 'react';
import type { GestorFormStep1 } from './gestor-onboarding-logic';

interface Step1IdentitySectionProps {
  form: GestorFormStep1;
  onChange: (key: keyof GestorFormStep1, value: string) => void;
}

export function Step1IdentitySection({ form, onChange }: Step1IdentitySectionProps) {
  const handleChange = useCallback((key: keyof GestorFormStep1, value: string) => {
    onChange(key, value);
  }, [onChange]);

  return (
    <div className="grid grid-cols-1 gap-3">
      <div>
        <label htmlFor="gestor-razao-social" className="text-sm font-medium text-gray-700">Razão Social</label>
        <input
          id="gestor-razao-social"
          type="text"
          value={form.razaoSocial}
          onChange={(e) => handleChange('razaoSocial', e.target.value)}
          className="w-full border rounded-lg p-2.5 text-sm"
        />
      </div>
      <div>
        <label htmlFor="gestor-nome-fantasia" className="text-sm font-medium text-gray-700">Nome Fantasia (CT)</label>
        <input
          id="gestor-nome-fantasia"
          type="text"
          value={form.nomeFantasia}
          onChange={(e) => handleChange('nomeFantasia', e.target.value)}
          className="w-full border rounded-lg p-2.5 text-sm"
        />
      </div>
    </div>
  );
}
