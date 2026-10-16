'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { clearAuthState } from '@/lib/auth-client';
import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog';
import { DashboardTopBar } from './DashboardTopBar';
import { DashboardSidebar } from './DashboardSidebar';
import type { DashboardView } from '../dashboard.types';

interface DashboardChromeProps {
  user: { name: string; role: string } | null;
  navigateToTarget: (view: DashboardView) => void;
}

/**
 * Cabeçalho fixo, menu lateral e fluxo de logout do dashboard.
 * Encapsula o estado do menu (hamburguer) e do alerta de confirmação de saída.
 */
export function DashboardChrome({ user, navigateToTarget }: DashboardChromeProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const startNewMatch = useCallback(() => {
    logger.info('[DashboardPage] new match click');
    router.push('/match/new');
  }, [router]);

  const endSession = useCallback(() => {
    logger.info('[DashboardPage] logout click');
    setLogoutConfirmOpen(true);
  }, []);

  const confirmLogout = useCallback(() => {
    setLogoutConfirmOpen(false);
    try {
      clearAuthState();
    } catch (err) {
      logger.error('[logout] Erro ao limpar auth state', err);
    }
    router.replace('/login');
  }, [router]);

  const menuItems = [
    { emoji: '🏠', label: 'Início', action: () => navigateToTarget('dashboard') },
    { emoji: '📜', label: 'Histórico', action: () => navigateToTarget('history') },
    { emoji: '📝', label: 'Partidas Anotadas', action: () => navigateToTarget('annotated') },
    { emoji: '🔴', label: 'Ao Vivo', action: () => navigateToTarget('live') },
    { emoji: '⏳', label: 'Aguardando', action: () => navigateToTarget('pending') },
    { emoji: '📋', label: 'Atletas', action: () => navigateToTarget('atletas') },
    { emoji: '👤', label: 'Dados Pessoais', action: () => navigateToTarget('profile') },
    ...(user?.role === 'ADMIN'
      ? [{ emoji: '⚙️', label: 'Admin', action: () => navigateToTarget('admin') }]
      : []),
    { emoji: '📝', label: 'Nova Partida', action: () => navigateToTarget('newMatch') },
    { emoji: '🚪', label: 'Sair', action: endSession },
  ];

  return (
    <>
      <DashboardTopBar
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        user={user}
        onNewMatch={startNewMatch}
        onLogout={endSession}
      />

      <DashboardSidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} menuItems={menuItems} />

      <ConfirmAlertDialog
        open={logoutConfirmOpen}
        title="Sair?"
        description="Deseja realmente sair?"
        confirmLabel="Sair"
        onConfirm={confirmLogout}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </>
  );
}
