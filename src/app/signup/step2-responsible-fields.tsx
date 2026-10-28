'use client';

import { useCallback } from 'react';
import type { GestorFormStep2 } from './gestor-onboarding-logic';

interface Step2ResponsibleFieldsProps {
  step2: GestorFormStep2;
  disabledFields: boolean;
  onChange: (key: string, value: string) => void;
}

export function Step2ResponsibleFields({ step2, disabledFields, onChange }: Step2ResponsibleFieldsProps) {
  const handleChange = useCallback((key: string, value: string) => {
    onChange(key, value);
  }, [onChange]);

  if (!step2.sameAsLegalRep) {
    return (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="gestor-responsavel-nome" className="text-sm font-medium text-gray-700">Nome completo</label>
            <input
              id="gestor-responsavel-nome"
              type="text"
              value={step2.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full border rounded-lg p-2.5 text-sm"
              disabled={disabledFields}
            />
          </div>
          <div>
            <label htmlFor="gestor-responsavel-cpf" className="text-sm font-medium text-gray-700">CPF</label>
            <input
              id="gestor-responsavel-cpf"
              type="text"
              value={step2.cpf}
              onChange={(e) => handleChange('cpf', e.target.value)}
              className="w-full border rounded-lg p-2.5 text-sm"
              disabled={disabledFields}
            />
          </div>
        </div>
        <div>
          <label htmlFor="gestor-responsavel-email" className="text-sm font-medium text-gray-700">E-mail</label>
          <input
            id="gestor-responsavel-email"
            type="email"
            value={step2.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full border rounded-lg p-2.5 text-sm"
            disabled={disabledFields}
          />
        </div>
      </>
    );
  }
  return null;
}
