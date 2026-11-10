'use client';

import { getShortcuts, getGreeting } from './dashboard-shortcuts.logic';
import { ShortcutCard } from './dashboard-shortcut-card';
import { AssignedNotifSection } from '@/components/dashboard/assigned-notif-section';
import { useNotificationCount } from '@/hooks/useNotificationCount';
import type { DashboardView } from '../dashboard.types';

export interface DashboardHomeSectionProps {
  userName?: string | null;
  activeArea?: string | null;
  navigateToTarget: (view: DashboardView) => void;
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
  const { poolWithAthlete, poolAvailable } = useNotificationCount();
  const isCoach = activeArea === 'TREINADOR_CLUBE' || activeArea === 'TREINADOR_AVULSO';

  const handleShortcutClick = (shortcutKey: string) => {
    if (shortcutKey === 'atletas' && poolWithAthlete > 0) {
      fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'POOL_MATCH_WITH_MY_ATHLETE' }),
      }).catch(() => {});
    } else if (shortcutKey === 'nova' && poolAvailable > 0) {
      fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'POOL_MATCH_AVAILABLE' }),
      }).catch(() => {});
    }
  };

  return (
    <section aria-labelledby="home-heading" className="space-y-7">
      <h2 id="home-heading" className="sr-only">Início</h2>

      {/* ── Saudação ── */}
      <div className="pt-1">
        <p className="text-xl font-bold text-telemetry-text-primary tracking-tight">{greeting.title}</p>
        <p className="text-sm text-telemetry-text-muted mt-0.5">{greeting.subtitle}</p>
      </div>

      {/* ── Mural do Treinador ── */}
      {isCoach && <AssignedNotifSection />}

      {/* ── Atalhos ── */}
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {shortcuts.map((s) => {
            const badgeCount = s.key === 'atletas' ? poolWithAthlete : s.key === 'nova' ? poolAvailable : 0;
            return (
              <ShortcutCard
                key={s.key}
                shortcut={s}
                activeArea={activeArea}
                badgeCount={badgeCount}
                onClick={navigateToTarget}
                onCardClick={() => handleShortcutClick(s.key)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
