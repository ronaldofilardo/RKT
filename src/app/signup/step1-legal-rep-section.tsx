'use client';

import { useCallback } from 'react';
import type { GestorFormStep1 } from './gestor-onboarding-logic';

interface Step1LegalRepSectionProps {
  form: GestorFormStep1;
  onChange: (key: keyof GestorFormStep1, value: string) => void;
}

export function Step1LegalRepSection({ form, onChange }: Step1LegalRepSectionProps) {
  const handleChange = useCallback((key: keyof GestorFormStep1, value: string) => {
    onChange(key, value);
  }, [onChange]);

  return (
    <div className="space-y-3 pt-4 border-t">
      <span className="text-sm font-medium text-gray-700">Representante Legal</span>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="gestor-legal-rep-nome" className="text-sm font-medium text-gray-700">Nome completo</label>
          <input
            id="gestor-legal-rep-nome"
            type="text"
            value={form.legalRepName}
            onChange={(e) => handleChange('legalRepName', e.target.value)}
            className="w-full border rounded-lg p-2.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="gestor-legal-rep-cpf" className="text-sm font-medium text-gray-700">CPF</label>
          <input
            id="gestor-legal-rep-cpf"
            type="text"
            value={form.legalRepCpf}
            onChange={(e) => handleChange('legalRepCpf', e.target.value)}
            className="w-full border rounded-lg p-2.5 text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="gestor-legal-rep-email" className="text-sm font-medium text-gray-700">E-mail</label>
          <input
            id="gestor-legal-rep-email"
            type="email"
            value={form.legalRepEmail}
            onChange={(e) => handleChange('legalRepEmail', e.target.value)}
            className="w-full border rounded-lg p-2.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="gestor-legal-rep-telefone" className="text-sm font-medium text-gray-700">Telefone</label>
          <input
            id="gestor-legal-rep-telefone"
            type="tel"
            value={form.legalRepPhone}
            onChange={(e) => handleChange('legalRepPhone', e.target.value)}
            className="w-full border rounded-lg p-2.5 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
