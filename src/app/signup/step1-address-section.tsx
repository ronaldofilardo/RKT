'use client';

import { useCallback } from 'react';
import type { GestorFormStep1 } from './gestor-onboarding-logic';

interface Step1AddressSectionProps {
  form: GestorFormStep1;
  onAddressChange: (key: string, value: string) => void;
}

export function Step1AddressSection({ form, onAddressChange }: Step1AddressSectionProps) {
  const handleAddressChange = useCallback((key: string, value: string) => {
    onAddressChange(key, value);
  }, [onAddressChange]);

  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-gray-700">Endereço</span>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="gestor-endereco-rua" className="text-xs font-medium text-gray-500">Rua</label>
          <input
            id="gestor-endereco-rua"
            type="text"
            value={form.endereco.rua}
            onChange={(e) => handleAddressChange('rua', e.target.value)}
            className="w-full border rounded-lg p-2.5 text-xs"
          />
        </div>
        <div>
          <label htmlFor="gestor-endereco-numero" className="text-xs font-medium text-gray-500">Número</label>
          <input
            id="gestor-endereco-numero"
            type="text"
            value={form.endereco.numero}
            onChange={(e) => handleAddressChange('numero', e.target.value)}
            className="w-full border rounded-lg p-2.5 text-xs"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="gestor-endereco-complemento" className="text-xs font-medium text-gray-500">Complemento</label>
          <input
            id="gestor-endereco-complemento"
            type="text"
            value={form.endereco.complemento}
            onChange={(e) => handleAddressChange('complemento', e.target.value)}
            className="w-full border rounded-lg p-2.5 text-xs"
          />
        </div>
        <div>
          <label htmlFor="gestor-endereco-bairro" className="text-xs font-medium text-gray-500">Bairro</label>
          <input
            id="gestor-endereco-bairro"
            type="text"
            value={form.endereco.bairro}
            onChange={(e) => handleAddressChange('bairro', e.target.value)}
            className="w-full border rounded-lg p-2.5 text-xs"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="gestor-endereco-cidade" className="text-xs font-medium text-gray-500">Cidade</label>
          <input
            id="gestor-endereco-cidade"
            type="text"
            value={form.endereco.cidade}
            onChange={(e) => handleAddressChange('cidade', e.target.value)}
            className="w-full border rounded-lg p-2.5 text-xs"
          />
        </div>
        <div>
          <label htmlFor="gestor-endereco-estado" className="text-xs font-medium text-gray-500">Estado (UF)</label>
          <input
            id="gestor-endereco-estado"
            type="text"
            value={form.endereco.estado}
            maxLength={2}
            onChange={(e) => handleAddressChange('estado', e.target.value)}
            className="w-full border rounded-lg p-2.5 text-xs"
          />
        </div>
        <div>
          <label htmlFor="gestor-endereco-cep" className="text-xs font-medium text-gray-500">CEP</label>
          <input
            id="gestor-endereco-cep"
            type="text"
            value={form.endereco.cep}
            onChange={(e) => handleAddressChange('cep', e.target.value)}
            className="w-full border rounded-lg p-2.5 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
