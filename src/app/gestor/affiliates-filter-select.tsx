'use client';

import React from 'react';

interface FilterSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: React.ReactNode;
}

export function FilterSelect({ label, children, ...rest }: FilterSelectProps) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-telemetry-text-muted">
      <span>{label}:</span>
      <select
        className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-telemetry-elevated text-telemetry-text-primary text-xs [color-scheme:dark] focus:outline-none focus:border-telemetry-blue"
        {...rest}
      >
        {children}
      </select>
    </label>
  );
}
