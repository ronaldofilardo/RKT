'use client';

import type { DashboardMatchPayload } from './match-card-types';

const BTN_BASE = 'px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1';
const VARIANT = {
  elevated: 'bg-telemetry-elevated hover:bg-telemetry-active border border-telemetry-border/15 text-telemetry-text-primary shadow-sm',
  blue: 'bg-telemetry-blue hover:bg-telemetry-blue-light text-white shadow-sm',
} as const;

export interface HeaderButtonProps {
  id: string;
  match: DashboardMatchPayload;
  onClick: (match: DashboardMatchPayload) => void;
  title: string;
  ariaLabel?: string;
  emoji: string;
  label: string;
  mobileLabel?: string;
  variant?: keyof typeof VARIANT;
}

export function HeaderButton({
  id,
  match,
  onClick,
  title,
  ariaLabel,
  emoji,
  label,
  mobileLabel,
  variant = 'elevated',
}: HeaderButtonProps) {
  return (
    <button
      type="button"
      data-testid={`match-card-${id}-${match.id}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick(match);
      }}
      className={`${BTN_BASE} ${VARIANT[variant]}`}
      title={title}
      aria-label={ariaLabel ?? title}
    >
      <span aria-hidden="true">{emoji}</span>
      <span className="hidden sm:inline">{label}</span>
      {mobileLabel && <span className="sm:hidden">{mobileLabel}</span>}
    </button>
  );
}

