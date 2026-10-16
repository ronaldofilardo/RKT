'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminClient, type AdminUser } from '@/services/adminClient';

/** Estado e ações da página de administração de usuários. */
export function useAdminPage() {
  const router = useRouter();
  const [, setUser] = useState<{ role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUsers, setShowUsers] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('');
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;

  useEffect(() => {
    // O token real vive no cookie httpOnly `rkt_access_token` (middleware/API);
    // o sessionStorage guarda só user_id/user_role. Exigir `access_token` aqui
    // redirecionava para /login mesmo com sessão válida.
    const userRole = sessionStorage.getItem('user_role');

    if (!userRole) { router.push('/login'); return; }
    if (userRole !== 'ADMIN') { router.push('/dashboard'); return; }

    setUser({ role: userRole });
    setLoading(false);
  }, [router]);

  const endSession = () => setLogoutConfirmOpen(true);

  const confirmLogout = () => {
    setLogoutConfirmOpen(false);
    sessionStorage.clear();
    router.push('/login');
  };

  const loadUsers = useCallback(async () => {
    setError(null);
    try {
      const data = await adminClient.listUsers(token);
      setUsers(data.data?.users ?? data.users ?? []);
    } catch {
      setError('Erro ao carregar usuários');
    }
  }, [token]);

  const updateUserRole = async (userId: string) => {
    if (!newRole) return;
    setError(null);
    try {
      await adminClient.updateUserRole(userId, newRole, token);
      setEditingUser(null);
      setNewRole('');
      await loadUsers();
    } catch {
      setError('Erro ao atualizar role');
    }
  };

  const removeUserAccount = (u: AdminUser) => setUserToDelete(u);

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setError(null);
    setDeletingUser(true);
    try {
      await adminClient.deleteUser(userToDelete.id, token);
      await loadUsers();
    } catch {
      setError('Erro ao excluir usuário');
    } finally {
      setDeletingUser(false);
      setUserToDelete(null);
    }
  };

  return {
    router, loading, showUsers, setShowUsers, users, error,
    editingUser, setEditingUser, newRole, setNewRole,
    logoutConfirmOpen, setLogoutConfirmOpen,
    userToDelete, setUserToDelete, deletingUser,
    endSession, confirmLogout, loadUsers,
    updateUserRole, removeUserAccount, confirmDeleteUser,
  };
}
