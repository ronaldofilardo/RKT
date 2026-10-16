import React from 'react';
import type { AthleteForm } from '@/app/atletas/types';
import { fieldIds } from './new-athlete-modal-form.types';

type BirthField = keyof Pick<AthleteForm, 'birthDay' | 'birthMonth' | 'birthYear'>;

interface BirthPart {
  field: BirthField;
  label: string;
  min: string;
  max: string;
  placeholder: string;
  maxLength: number;
  widthClass: string;
}

const BIRTH_PARTS: BirthPart[] = [
  { field: 'birthDay', label: 'Dia', min: '1', max: '31', placeholder: 'DD', maxLength: 2, widthClass: 'w-28' },
  { field: 'birthMonth', label: 'Mês', min: '1', max: '12', placeholder: 'MM', maxLength: 2, widthClass: 'w-28' },
  { field: 'birthYear', label: 'Ano', min: '1900', max: '2030', placeholder: 'AAAA', maxLength: 4, widthClass: 'w-36' },
];

interface BirthDateFieldsProps {
  form: AthleteForm;
  submitting: boolean;
  onChange: (field: BirthField, value: string) => void;
}

export function BirthDateFields({ form, submitting, onChange }: BirthDateFieldsProps) {
  return (
    <div className="flex items-end gap-3">
      {BIRTH_PARTS.map((part, index) => (
        <React.Fragment key={part.field}>
          <div className={part.widthClass}>
            <label htmlFor={fieldIds[part.field]} className="sr-only">{part.label}</label>
            <input
              id={fieldIds[part.field]}
              type="number"
              min={part.min}
              max={part.max}
              value={form[part.field]}
              onChange={(e) => onChange(part.field, e.target.value)}
              disabled={submitting}
              placeholder={part.placeholder}
              maxLength={part.maxLength}
              className="w-full px-3 py-2.5 border-2 border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt focus:border-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary placeholder-telemetry-text-muted/50 text-center text-base"
            />
          </div>
          {index < BIRTH_PARTS.length - 1 && <span className="text-telemetry-text-muted text-xl font-medium mb-2.5">/</span>}
        </React.Fragment>
      ))}
    </div>
  );
}
