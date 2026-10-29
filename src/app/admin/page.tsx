'use client';

import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog';
import type { AdminUser } from '@/services/adminClient';
import { useAdminPage } from './use-admin-page';
import { AdminUsersTable } from './admin-users-table';
import { AdminLoadingScreen, AdminCards, AdminBackLink } from './admin-dashboard-chrome';
import { DashboardChrome } from '@/app/dashboard/components/DashboardChrome';
import { homeForProfileString } from '@/core/access/home';

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
    <div className="min-h-screen bg-telemetry-base text-telemetry-text-primary">
      <DashboardChrome title="Admin Dashboard" onLogout={endSession} />

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {error && (
          <div className="mb-4 p-3 bg-telemetry-error/10 border border-telemetry-error/30 text-telemetry-error rounded-lg text-sm">{error}</div>
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

        <AdminBackLink onBack={() => router.push(homeForProfileString(sessionStorage.getItem('user_role')) as any)} />
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
