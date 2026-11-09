'use client';

import { getShortcuts, getGreeting } from './dashboard-shortcuts.logic';
import { ShortcutCard } from './dashboard-shortcut-card';
import type { DashboardView } from '../dashboard.types';

export interface DashboardHomeSectionProps {
  userName?: string | null;
  activeArea?: string | null;
  navigateToTarget: (view: DashboardView) => void;
  // Props mantidas para retrocompatibilidade caso consumidores legados as passem
  visibleMatches?: unknown;
  suspendedFromApi?: unknown;
  ctId?: unknown;
  ctName?: unknown;
  userId?: unknown;
  followedPlayerIds?: unknown;
  openMatchDetails?: unknown;
  openMatchReport?: unknown;
  finishMatch?: unknown;
  deleteMatch?: unknown;
  openMatchEditScore?: unknown;
  resumeMatch?: unknown;
  openMatchSetSummary?: unknown;
  openMatchEditInfo?: unknown;
  onShareMatch?: unknown;
}

export function DashboardHomeSection({
  userName,
  activeArea,
  navigateToTarget,
}: DashboardHomeSectionProps) {
  const shortcuts = getShortcuts(activeArea);
  const greeting = getGreeting(userName, activeArea);

  return (
    <section aria-labelledby="home-heading" className="space-y-7">
      <h2 id="home-heading" className="sr-only">Início</h2>

      {/* ── Saudação ── */}
      <div className="pt-1">
        <p className="text-xl font-bold text-telemetry-text-primary tracking-tight">{greeting.title}</p>
        <p className="text-sm text-telemetry-text-muted mt-0.5">{greeting.subtitle}</p>
      </div>

      {/* ── Atalhos ── */}
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {shortcuts.map((s) => (
            <ShortcutCard
              key={s.key}
              shortcut={s}
              activeArea={activeArea}
              onClick={navigateToTarget}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
