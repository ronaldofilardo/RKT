'use client';

import { useCallback } from 'react';
import type { GestorFormStep2 } from './gestor-onboarding-logic';

interface Step2PasswordFieldsProps {
  step2: GestorFormStep2;
  onChange: (key: string, value: string) => void;
}

export function Step2PasswordFields({ step2, onChange }: Step2PasswordFieldsProps) {
  const handleChange = useCallback((key: string, value: string) => {
    onChange(key, value);
  }, [onChange]);

  return (
    <>
      <div>
        <label htmlFor="gestor-senha" className="text-sm font-medium text-gray-700">Senha</label>
        <input
          id="gestor-senha"
          type="password"
          value={step2.password}
          onChange={(e) => handleChange('password', e.target.value)}
          minLength={8}
          className="w-full border rounded-lg p-2.5 text-sm"
        />
      </div>
      <div>
        <label htmlFor="gestor-confirmar-senha" className="text-sm font-medium text-gray-700">Confirme a senha</label>
        <input
          id="gestor-confirmar-senha"
          type="password"
          value={step2.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          minLength={8}
          className="w-full border rounded-lg p-2.5 text-sm"
        />
      </div>
    </>
  );
}
