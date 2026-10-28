'use client';

import { useCallback } from 'react';
import type { GestorFormStep2 } from './gestor-onboarding-logic';

interface Step2CheckboxProps {
  step2: GestorFormStep2;
  onToggleSame: () => void;
}

export function Step2Checkbox({ step2, onToggleSame }: Step2CheckboxProps) {
  const handleToggle = useCallback(() => {
    onToggleSame();
  }, [onToggleSame]);

  return (
    <div className="flex items-start gap-2">
      <input
        id="gestor-same-as-legal-rep"
        type="checkbox"
        checked={step2.sameAsLegalRep}
        onChange={handleToggle}
        className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500 mt-0.5"
      />
      <label htmlFor="gestor-same-as-legal-rep" className="text-sm font-medium text-gray-700">
        O responsável pelo sistema é o mesmo representante legal da PJ
      </label>
    </div>
  );
}
