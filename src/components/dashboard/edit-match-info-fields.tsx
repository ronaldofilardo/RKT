'use client';

import type { ReactNode } from 'react';

const INPUT_CLASS =
  'w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-white dark:bg-telemetry-card text-slate-900 dark:text-telemetry-text-primary';
const WITH_PLACEHOLDER = `${INPUT_CLASS} placeholder-telemetry-text-muted/40`;
const WITH_CURSOR = `${INPUT_CLASS} cursor-pointer`;

const LABEL_CLASS = 'block text-xs font-medium text-telemetry-text-muted mb-1';

export function FormField({ htmlFor, label, hint, children }: {
  htmlFor: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={LABEL_CLASS}>
        {label}
        {hint && <span className="text-telemetry-text-muted font-normal"> {hint}</span>}
      </label>
      {children}
    </div>
  );
}

/** Abre o seletor nativo do input date/time sem lançar em browsers sem suporte. */
function openPicker(e: React.MouseEvent<HTMLInputElement>) {
  try {
    e.currentTarget.showPicker?.();
  } catch {
    // ste-exception R-08: showPicker() lança quando o browser não
    // suporta ou o picker já está aberto. Degradação silenciosa esperada.
  }
}

interface TextInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'date' | 'time' | 'number';
}

export function TextInput({ id, value, onChange, placeholder, type = 'text' }: TextInputProps) {
  const isPicker = type === 'date' || type === 'time';
  const className = isPicker ? WITH_CURSOR : placeholder ? WITH_PLACEHOLDER : INPUT_CLASS;
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={isPicker ? openPicker : undefined}
      placeholder={placeholder}
      className={className}
    />
  );
}

export function SelectField({ id, value, onChange, children }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={WITH_CURSOR}
    >
      {children}
    </select>
  );
}

export function TextareaField({ id, value, onChange, placeholder, rows = 3 }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`${WITH_PLACEHOLDER} resize-y`}
    />
  );
}

