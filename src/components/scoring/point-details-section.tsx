import type { ReactNode, RefObject } from 'react';

interface SectionProps {
  num?: string;
  label: string;
  children: ReactNode;
  ref?: RefObject<HTMLDivElement>;
}

export function Section({ num, label, children, ref }: SectionProps) {
  return (
    <div ref={ref}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
        {num ? `${num}. ` : ''}{label}
      </p>
      {children}
    </div>
  );
}