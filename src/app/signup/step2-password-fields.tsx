'use client';

import { useCallback } from 'react';
import type { GestorFormStep2 } from './gestor-onboarding-logic';
import { PasswordInput } from '@/components/ui/password-input';

interface Step2PasswordFieldsProps {
  step2: GestorFormStep2;
  onChange: (key: string, value: string) => void;
}

export function Step2PasswordFields({ step2, onChange }: Step2PasswordFieldsProps) {
  const handleChange = useCallback((key: string, value: string) => {
    onChange(key, value);
  }, [onChange]);

  const passwordsMatch = !step2.confirmPassword || step2.password === step2.confirmPassword;

  return (
    <>
      <div>
        <label htmlFor="gestor-senha" className="text-sm font-medium text-gray-700 block mb-1">Senha</label>
        <PasswordInput
          id="gestor-senha"
          name="password"
          placeholder="Mínimo 8 caracteres"
          value={step2.password}
          onChange={(e) => handleChange('password', e.target.value)}
          minLength={8}
          required
        />
      </div>
      <div>
        <label htmlFor="gestor-confirmar-senha" className="text-sm font-medium text-gray-700 block mb-1">Confirme a senha</label>
        <PasswordInput
          id="gestor-confirmar-senha"
          name="confirmPassword"
          placeholder="Repita a senha"
          value={step2.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          minLength={8}
          error={!passwordsMatch}
          required
        />
        {!passwordsMatch && (
          <span className="text-xs text-red-500 mt-1 block font-medium">As senhas não conferem</span>
        )}
      </div>
    </>
  );
}
