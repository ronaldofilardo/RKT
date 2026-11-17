import React from 'react';
import type { SortDirection } from './athlete-table-sort.logic';

interface SortIconProps {
  active: boolean;
  direction: SortDirection;
}

export function AthleteTableSortIcon({ active, direction }: SortIconProps) {
  if (!active) {
    return (
      <svg
        className="w-3.5 h-3.5 text-telemetry-text-muted opacity-30 group-hover:opacity-80 transition-opacity"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m7 15 5 5 5-5" />
        <path d="m7 9 5-5 5 5" />
      </svg>
    );
  }

  if (direction === 'asc') {
    return (
      <svg
        className="w-3.5 h-3.5 text-telemetry-volt font-bold"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
    );
  }

  return (
    <svg
      className="w-3.5 h-3.5 text-telemetry-volt font-bold"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
