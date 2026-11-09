'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { performLogout } from '@/lib/auth-client';
import { buildMenu } from '@/core/access/menu';
import { menuContextFromMe } from '@/core/access/menu-context';
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog';
import { useActiveArea, useAreaPath } from '@/hooks/use-area-path';
import { DashboardTopBar } from './DashboardTopBar';
import { DashboardSidebar } from './DashboardSidebar';
import { getDefaultMenuContext, mapMenuSectionsToSidebar } from './dashboard-menu.logic';
import type { DashboardView } from '../dashboard.types';

interface DashboardChromeProps {
  user?: { name: string; role: string } | null;
  navigateToTarget?: (view: DashboardView) => void;
  title?: string;
  onLogout?: () => void;
  onContextSwitched?: () => void;
  /** false remove o menu hambúrguer e a barra lateral (ex.: painel do gestor). Padrão: true. */
  showMenu?: boolean;
  /** false oculta o botão "Sair" do header (ex.: painel do suporte). Padrão: true. */
  showLogout?: boolean;
}

export function DashboardChrome({ user, navigateToTarget, title, onLogout, onContextSwitched, showMenu = true, showLogout = true }: DashboardChromeProps) {
  const router = useRouter();
  const toAreaPath = useAreaPath();
  const activeArea = useActiveArea();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [meData, setMeData] = useState<any>(null);

  const refreshMe = useCallback(() => {
    fetch('/api/auth/me').then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setMeData(data); }).catch(() => { });
    onContextSwitched?.();
  }, [onContextSwitched]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me').then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!cancelled && data) setMeData(data); }).catch(() => { });
    return () => { cancelled = true; };
  }, []);

  const internalEndSession = useCallback(() => {
    logger.info('[DashboardPage] logout click');
    setLogoutConfirmOpen(true);
  }, []);
  const endSession = onLogout ?? internalEndSession;

  const confirmLogout = useCallback(async () => {
    setLogoutConfirmOpen(false);
    try { await performLogout(); } catch (err) { logger.error('[logout] Erro', err); }
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
      window.location.replace('/login?exit=1');
    } else { router.replace('/login'); }
  }, [router]);

  const currentUser = user || (meData?.user ? { name: meData.user.name, role: meData.user.role } : null);

  const sections = useMemo(() => {
    const ctx = (meData && meData.user)
      ? menuContextFromMe(meData, activeArea)
      : getDefaultMenuContext(currentUser?.role);
    const rawSections = buildMenu(ctx);
    return mapMenuSectionsToSidebar(rawSections, {
      navigateToTarget, routerPush: (href) => router.push(toAreaPath(href) as any), endSession,
    });
  }, [meData, currentUser?.role, navigateToTarget, router, endSession, toAreaPath, activeArea]);

  return (
    <>
      <DashboardTopBar
        menuOpen={menuOpen} setMenuOpen={setMenuOpen} user={currentUser} title={title}
        onLogout={endSession}
        showMenuButton={showMenu} showLogout={showLogout}
        activeContextId={meData?.activeContextId} availableContexts={meData?.availableContexts}
        onContextSwitched={refreshMe}
      />
      {showMenu && <DashboardSidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} sections={sections} />}
      {!onLogout && (
        <ConfirmAlertDialog
          open={logoutConfirmOpen} title="Sair?" description="Deseja realmente sair?" confirmLabel="Sair"
          onConfirm={confirmLogout} onCancel={() => setLogoutConfirmOpen(false)}
        />
      )}
    </>
  );
}
