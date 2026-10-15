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
  handleNavigate: (view: DashboardView) => void;
}

/**
 * Cabeçalho fixo, menu lateral e fluxo de logout do dashboard.
 * Encapsula o estado do menu (hamburguer) e do alerta de confirmação de saída.
 */
export function DashboardChrome({ user, handleNavigate }: DashboardChromeProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const handleNewMatch = useCallback(() => {
    logger.info('[DashboardPage] new match click');
    router.push('/match/new');
  }, [router]);

  const handleLogout = useCallback(() => {
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
    { emoji: '🏠', label: 'Início', action: () => handleNavigate('dashboard') },
    { emoji: '📜', label: 'Histórico', action: () => handleNavigate('history') },
    { emoji: '📝', label: 'Partidas Anotadas', action: () => handleNavigate('annotated') },
    { emoji: '🔴', label: 'Ao Vivo', action: () => handleNavigate('live') },
    { emoji: '⏳', label: 'Aguardando', action: () => handleNavigate('pending') },
    { emoji: '📋', label: 'Atletas', action: () => handleNavigate('atletas') },
    { emoji: '👤', label: 'Dados Pessoais', action: () => handleNavigate('profile') },
    ...(user?.role === 'ADMIN'
      ? [{ emoji: '⚙️', label: 'Admin', action: () => handleNavigate('admin') }]
      : []),
    { emoji: '📝', label: 'Nova Partida', action: () => handleNavigate('newMatch') },
    { emoji: '🚪', label: 'Sair', action: handleLogout },
  ];

  return (
    <>
      <DashboardTopBar
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        user={user}
        onNewMatch={handleNewMatch}
        onLogout={handleLogout}
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
