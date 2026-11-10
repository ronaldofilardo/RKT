'use client';

import Link from 'next/link';
import { appPath } from '@/core/access/app-path.logic';
import { NotifBadge } from '@/components/ui/notif-badge';
import type { Shortcut } from './dashboard-shortcuts.logic';
import type { DashboardView } from '../dashboard.types';

export function ShortcutCard({
  shortcut,
  activeArea,
  badgeCount,
  onClick,
  onCardClick,
}: {
  shortcut: Shortcut;
  activeArea?: string | null;
  badgeCount?: number;
  onClick: (view: DashboardView) => void;
  onCardClick?: () => void;
}) {
  const isAction = !shortcut.soon && !shortcut.href;

  const content = (
    <div
      className={[
        'relative flex flex-col items-center gap-2 p-4 rounded-lg border transition-all transition-colors duration-150 select-none',
        shortcut.soon
          ? 'border-white/5 bg-telemetry-elevated/40 opacity-50 cursor-default'
          : shortcut.highlight
          ? 'border-telemetry-blue/50 bg-telemetry-blue/10 hover:bg-telemetry-blue/20 shadow-sm shadow-telemetry-blue/10 cursor-pointer'
          : 'border-white/10 bg-telemetry-card hover:bg-telemetry-elevated hover:border-white/20 cursor-pointer',
      ].join(' ')}
      role={isAction ? 'button' : undefined}
      tabIndex={isAction ? 0 : shortcut.soon ? -1 : undefined}
      aria-label={shortcut.label}
      onClick={isAction ? () => {
        onCardClick?.();
        if (shortcut.view) onClick(shortcut.view as DashboardView);
      } : undefined}
      onKeyDown={
        isAction
          ? (e) => {
              if ((e.key === 'Enter' || e.key === ' ') && shortcut.view) {
                e.preventDefault();
                onCardClick?.();
                onClick(shortcut.view as DashboardView);
              }
            }
          : undefined
      }
    >
      {badgeCount !== undefined && badgeCount > 0 && (
        <NotifBadge count={badgeCount} />
      )}
      {shortcut.soon && (
        <span className="absolute top-2 right-2 text-[9px] font-bold text-telemetry-text-muted/60 uppercase tracking-wider bg-white/5 px-1.5 py-0.5 rounded">
          Em breve
        </span>
      )}
      <span className="text-2xl leading-none" aria-hidden="true">{shortcut.icon}</span>
      <span className={`text-[13px] font-semibold text-center leading-tight ${shortcut.highlight ? 'text-telemetry-blue-light' : 'text-telemetry-text-primary'}`}>
        {shortcut.label}
      </span>
      <span className="text-[10px] text-telemetry-text-muted text-center leading-tight">
        {shortcut.sublabel}
      </span>
    </div>
  );

  if (shortcut.href && !shortcut.soon) {
    const resolved = appPath(activeArea, shortcut.href);
    return <Link href={resolved as any} className="block" onClick={onCardClick}>{content}</Link>;
  }

  return content;
}
