'use client';

import { useCallback } from 'react';
import type { GestorFormStep1 } from './gestor-onboarding-logic';
import { FormField } from '@/components/ui/form-field';
import { maskPhone } from '@/lib/validators/masks';
import { validatePhoneField, validateEmailField } from '@/lib/validators/field-validators';

interface Step1ContactSectionProps {
  form: GestorFormStep1;
  onChange: (key: keyof GestorFormStep1, value: string) => void;
}

export function Step1ContactSection({ form, onChange }: Step1ContactSectionProps) {
  const handlePhone = useCallback((value: string) => {
    onChange('telefone', value);
  }, [onChange]);

  const handleEmail = useCallback((value: string) => {
    onChange('email', value);
  }, [onChange]);

  return (
    <div className="grid grid-cols-2 gap-3">
      <FormField
        id="gestor-telefone"
        type="tel"
        label="Telefone"
        placeholder="(00) 00000-0000"
        value={form.telefone}
        onChange={handlePhone}
        mask={maskPhone}
        validate={validatePhoneField}
      />
      <FormField
        id="gestor-email-institucional"
        type="email"
        label="E-mail institucional"
        placeholder="contato@clube.com.br"
        value={form.email}
        onChange={handleEmail}
        validate={validateEmailField}
      />
    </div>
  );
}
