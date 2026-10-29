'use client';

import React from 'react';
import Link from 'next/link';

export type EmptyStateIcon = 'hourglass' | 'lock' | 'link-off' | 'users';

interface Props {
  icon: EmptyStateIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionHref?: string;
}

function RenderIcon({ icon }: { icon: EmptyStateIcon }) {
  const cls = 'w-7 h-7 text-telemetry-text-muted';
  if (icon === 'hourglass') {
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 3h12M6 21h12M7 3v3.5a5 5 0 002 4 5 5 0 00-2 4V21m10-18v3.5a5 5 0 01-2 4 5 5 0 012 4V21" />
      </svg>
    );
  }
  if (icon === 'lock') {
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="11" width="14" height="10" rx="2" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 11V7a4 4 0 018 0v4" />
      </svg>
    );
  }
  if (icon === 'users') {
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    );
  }
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1M3 3l18 18" />
    </svg>
  );
}

export function SpectatorEmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  actionHref,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 px-4 gap-2">
      <div className="w-12 h-12 rounded-full bg-telemetry-base/60 border border-telemetry-border/15 flex items-center justify-center mb-1">
        <RenderIcon icon={icon} />
      </div>
      <b className="text-sm font-medium text-telemetry-text-primary">{title}</b>
      <p className="text-xs text-telemetry-text-muted m-0 max-w-xs">{description}</p>
      {actionText && actionHref && (
        <Link
          href={actionHref as any}
          className="mt-3 w-full py-2.5 bg-telemetry-elevated border border-telemetry-border/20 text-telemetry-text-primary text-xs font-medium rounded-lg hover:bg-telemetry-elevated/80 transition-colors inline-block"
        >
          {actionText}
        </Link>
      )}
      {actionText && !actionHref && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 w-full py-2.5 bg-telemetry-elevated border border-telemetry-border/20 text-telemetry-text-primary text-xs font-medium rounded-lg hover:bg-telemetry-elevated/80 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
