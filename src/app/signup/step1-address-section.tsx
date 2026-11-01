'use client';

import { useCallback } from 'react';
import type { GestorFormStep1 } from './gestor-onboarding-logic';
import { FormField } from '@/components/ui/form-field';
import { maskCep, maskUf } from '@/lib/validators/masks';
import { validateCepField, validateUfField } from '@/lib/validators/field-validators';

interface Step1AddressSectionProps {
  form: GestorFormStep1;
  onAddressChange: (key: string, value: string) => void;
}

export function Step1AddressSection({ form, onAddressChange }: Step1AddressSectionProps) {
  const handleAddr = useCallback((key: string, value: string) => {
    onAddressChange(key, value);
  }, [onAddressChange]);

  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-gray-700">Endereço</span>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          id="gestor-endereco-rua"
          label="Rua"
          value={form.endereco.rua}
          onChange={(v) => handleAddr('rua', v)}
          labelClassName="text-xs font-medium text-gray-500"
        />
        <FormField
          id="gestor-endereco-numero"
          label="Número"
          value={form.endereco.numero}
          onChange={(v) => handleAddr('numero', v)}
          labelClassName="text-xs font-medium text-gray-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          id="gestor-endereco-complemento"
          label="Complemento"
          value={form.endereco.complemento}
          onChange={(v) => handleAddr('complemento', v)}
          labelClassName="text-xs font-medium text-gray-500"
        />
        <FormField
          id="gestor-endereco-bairro"
          label="Bairro"
          value={form.endereco.bairro}
          onChange={(v) => handleAddr('bairro', v)}
          labelClassName="text-xs font-medium text-gray-500"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField
          id="gestor-endereco-cidade"
          label="Cidade"
          value={form.endereco.cidade}
          onChange={(v) => handleAddr('cidade', v)}
          labelClassName="text-xs font-medium text-gray-500"
        />
        <FormField
          id="gestor-endereco-estado"
          label="Estado (UF)"
          placeholder="UF"
          maxLength={2}
          value={form.endereco.estado}
          onChange={(v) => handleAddr('estado', v)}
          mask={maskUf}
          validate={validateUfField}
          labelClassName="text-xs font-medium text-gray-500"
        />
        <FormField
          id="gestor-endereco-cep"
          label="CEP"
          placeholder="00000-000"
          value={form.endereco.cep}
          onChange={(v) => handleAddr('cep', v)}
          mask={maskCep}
          validate={validateCepField}
          labelClassName="text-xs font-medium text-gray-500"
        />
      </div>
    </div>
  );
}
