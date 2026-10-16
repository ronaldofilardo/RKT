'use client';

interface DateTimePickerInputProps {
  id: string;
  type: 'date' | 'time';
  value: string;
  onChange: (value: string) => void;
}

export function DateTimePickerInput({ id, type, value, onChange }: DateTimePickerInputProps) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => {
        try {
          e.currentTarget.showPicker?.();
        } catch {
          // ste-exception R-08: showPicker() lança quando o browser não
          // suporta ou o picker já está aberto. Degradação silenciosa esperada.
        }
      }}
      className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-white dark:bg-telemetry-elevated text-slate-900 dark:text-telemetry-text-primary cursor-pointer"
    />
  );
}
