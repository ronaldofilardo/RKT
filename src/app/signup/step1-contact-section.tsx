'use client';

import { useCallback } from 'react';
import type { GestorFormStep1 } from './gestor-onboarding-logic';

interface Step1ContactSectionProps {
  form: GestorFormStep1;
  onChange: (key: keyof GestorFormStep1, value: string) => void;
}

export function Step1ContactSection({ form, onChange }: Step1ContactSectionProps) {
  const handleChange = useCallback((key: keyof GestorFormStep1, value: string) => {
    onChange(key, value);
  }, [onChange]);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label htmlFor="gestor-telefone" className="text-sm font-medium text-gray-700">Telefone</label>
        <input
          id="gestor-telefone"
          type="tel"
          value={form.telefone}
          onChange={(e) => handleChange('telefone', e.target.value)}
          className="w-full border rounded-lg p-2.5 text-sm"
        />
      </div>
      <div>
        <label htmlFor="gestor-email-institucional" className="text-sm font-medium text-gray-700">E-mail institucional</label>
        <input
          id="gestor-email-institucional"
          type="email"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className="w-full border rounded-lg p-2.5 text-sm"
        />
      </div>
    </div>
  );
}
