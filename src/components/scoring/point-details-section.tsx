import { forwardRef, type ReactNode, type RefObject } from 'react';

interface SectionProps {
  num?: string;
  label: string;
  children: ReactNode;
  ref?: RefObject<HTMLDivElement>;
}

export const Section = forwardRef<HTMLDivElement, SectionProps>(({ num, label, children }, ref) => {
  return (
    <div ref={ref}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-telemetry-text-muted dark:text-telemetry-text-muted mb-2">
        {num ? `${num}. ` : ''}{label}
      </p>
      {children}
    </div>
  );
});

Section.displayName = 'Section';