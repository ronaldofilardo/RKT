'use client';

import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog';
import type { AdminUser } from '@/services/adminClient';
import { useAdminPage } from './use-admin-page';
import { AdminUsersTable } from './admin-users-table';
import { AdminLoadingScreen, AdminHeader, AdminCards, AdminBackLink } from './admin-dashboard-chrome';

export type User = AdminUser;

export default function AdminPage() {
  const {
    router, loading, showUsers, setShowUsers, users, error,
    editingUser, setEditingUser, newRole, setNewRole,
    logoutConfirmOpen, setLogoutConfirmOpen,
    userToDelete, setUserToDelete, deletingUser,
    endSession, confirmLogout, loadUsers, updateUserRole, removeUserAccount, confirmDeleteUser,
  } = useAdminPage();

  if (loading) return <AdminLoadingScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader onLogout={endSession} />

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <AdminCards
          showUsers={showUsers}
          onToggleUsers={() => { setShowUsers(!showUsers); if (!showUsers) loadUsers(); }}
        />

        {showUsers && (
          <AdminUsersTable
            users={users}
            editingUser={editingUser}
            newRole={newRole}
            setNewRole={setNewRole}
            setEditingUser={setEditingUser}
            updateUserRole={updateUserRole}
            removeUserAccount={removeUserAccount}
          />
        )}

        <AdminBackLink onBack={() => router.push('/dashboard')} />
      </main>

      <ConfirmAlertDialog
        open={logoutConfirmOpen}
        title="Sair?"
        description="Tem certeza que deseja sair?"
        confirmLabel="Sair"
        onConfirm={confirmLogout}
        onCancel={() => setLogoutConfirmOpen(false)}
      />

      <ConfirmAlertDialog
        open={userToDelete !== null}
        title="Excluir usuário?"
        description={
          userToDelete
            ? `${userToDelete.name} (${userToDelete.email}) será excluído. Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir"
        loadingLabel="Excluindo..."
        variant="danger"
        loading={deletingUser}
        onConfirm={confirmDeleteUser}
        onCancel={() => setUserToDelete(null)}
      />
    </div>
  );
}
