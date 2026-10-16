import type { ReactNode } from 'react';

const inputClassName =
  'flex-1 px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary placeholder-telemetry-text-muted/50';

interface DetailsFieldProps {
  title: string;
  optional?: boolean;
  align?: 'center' | 'start';
  children: ReactNode;
}

export function DetailsField({ title, optional, align = 'center', children }: DetailsFieldProps) {
  return (
    <section className="bg-telemetry-card rounded-xl border border-white/10 p-4">
      <div className={`flex flex-col sm:flex-row gap-3 ${align === 'start' ? 'sm:items-start' : 'sm:items-center'}`}>
        <h2 className="text-base font-semibold text-telemetry-text-primary w-40 shrink-0">
          {title} {optional && <span className="text-telemetry-text-muted font-normal">(opcional)</span>}
        </h2>
        {children}
      </div>
    </section>
  );
}

interface DetailTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  id?: string;
  className?: string;
}

export function DetailTextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  id,
  className = inputClassName,
}: DetailTextInputProps) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}

interface DetailTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}

export function DetailTextarea({ value, onChange, placeholder, rows = 3 }: DetailTextareaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`${inputClassName} resize-y`}
    />
  );
}
