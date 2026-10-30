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
        className="mt-0.5 w-4 h-4 cursor-pointer appearance-none border-2 border-gray-400 rounded bg-white checked:bg-sky-600 checked:border-sky-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 transition-colors"
      />
      <label htmlFor="gestor-same-as-legal-rep" className="text-sm font-medium text-gray-700 cursor-pointer">
        O responsável pelo sistema é o mesmo representante legal da PJ
      </label>
    </div>
  );
}
