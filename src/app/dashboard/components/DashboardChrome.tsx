'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { clearAuthState } from '@/lib/auth-client';
import { buildMenu } from '@/core/access/menu';
import { menuContextFromMe } from '@/core/access/menu-context';
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog';
import { DashboardTopBar } from './DashboardTopBar';
import { DashboardSidebar } from './DashboardSidebar';
import { getDefaultMenuContext, mapMenuSectionsToSidebar } from './dashboard-menu.logic';
import type { DashboardView } from '../dashboard.types';

interface DashboardChromeProps {
  user?: { name: string; role: string } | null;
  navigateToTarget?: (view: DashboardView) => void;
  title?: string;
  onLogout?: () => void;
  /** false remove o menu hambúrguer e a barra lateral (ex.: painel do gestor). Padrão: true. */
  showMenu?: boolean;
}

export function DashboardChrome({ user, navigateToTarget, title, onLogout, showMenu = true }: DashboardChromeProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [meData, setMeData] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!cancelled && data) setMeData(data); })
      .catch(() => { });
    return () => { cancelled = true; };
  }, []);

  const internalEndSession = useCallback(() => {
    logger.info('[DashboardPage] logout click');
    setLogoutConfirmOpen(true);
  }, []);

  const endSession = onLogout ?? internalEndSession;

  const confirmLogout = useCallback(() => {
    setLogoutConfirmOpen(false);
    try { clearAuthState(); } catch (err) { logger.error('[logout] Erro', err); }
    router.replace('/login');
  }, [router]);

  const currentUser = user || (meData?.user ? { name: meData.user.name, role: meData.user.role } : null);

  const sections = useMemo(() => {
    const ctx = (meData && meData.user) ? menuContextFromMe(meData) : getDefaultMenuContext(currentUser?.role);
    const rawSections = buildMenu(ctx);
    return mapMenuSectionsToSidebar(rawSections, {
      navigateToTarget,
      routerPush: (href) => router.push(href as any),
      endSession,
    });
  }, [meData, currentUser?.role, navigateToTarget, router, endSession]);

  return (
    <>
      <DashboardTopBar
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        user={currentUser}
        title={title}
        onNewMatch={() => router.push('/match/new')}
        onLogout={endSession}
        showMenuButton={showMenu}
      />
      {showMenu && <DashboardSidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} sections={sections} />}
      {!onLogout && (
        <ConfirmAlertDialog
          open={logoutConfirmOpen}
          title="Sair?"
          description="Deseja realmente sair?"
          confirmLabel="Sair"
          onConfirm={confirmLogout}
          onCancel={() => setLogoutConfirmOpen(false)}
        />
      )}
    </>
  );
}
