'use client';

import React, { useState, useCallback } from 'react';

export interface FormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  onErrorChange?: (error: string | null) => void;
  mask?: (val: string) => string;
  validate?: (val: string) => string | null;
  labelClassName?: string;
}

export function FormField({
  id,
  label,
  value,
  onChange,
  error: externalError,
  onErrorChange,
  mask,
  validate,
  labelClassName = 'text-sm font-medium text-gray-700',
  className = '',
  onBlur: externalBlur,
  ...inputProps
}: FormFieldProps) {
  const [internalError, setInternalError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const currentError = externalError ?? internalError;

  const runValidation = useCallback((val: string) => {
    if (!validate) return null;
    const err = validate(val);
    setInternalError(err);
    onErrorChange?.(err);
    return err;
  }, [validate, onErrorChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = mask ? mask(raw) : raw;
    onChange(formatted);
    if (touched || currentError) {
      runValidation(formatted);
    }
  }, [mask, onChange, touched, currentError, runValidation]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    runValidation(e.target.value);
    externalBlur?.(e);
  }, [runValidation, externalBlur]);

  const hasError = Boolean(currentError);

  return (
    <div className="w-full">
      <label htmlFor={id} className={`block mb-1 ${labelClassName}`}>
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className={`w-full border rounded-lg p-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${hasError
          ? 'border-red-500 focus:border-red-500 focus:ring-red-200 bg-red-50/20'
          : 'border-gray-300 focus:border-sky-600 focus:ring-sky-100'
          } ${className}`}
        {...inputProps}
      />
      {hasError && (
        <span id={`${id}-error`} role="alert" className="text-xs text-red-500 mt-1 block font-medium">
          {currentError}
        </span>
      )}
    </div>
  );
}

