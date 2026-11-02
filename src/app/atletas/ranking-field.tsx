import type { ReactNode } from 'react';

const labelClass = 'h-4 flex items-center text-xs text-telemetry-text-muted whitespace-nowrap';

interface RankingFieldProps {
  id: string;
  label: string;
  children: ReactNode;
}

/** Campo rotulado do formulário de ranking (label acima do controle). */
export function RankingField({ id, label, children }: RankingFieldProps) {
  return (
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      <label htmlFor={id} className={labelClass}>{label}</label>
      {children}
    </div>
  );
}
