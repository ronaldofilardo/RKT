'use client';

import { ConfirmAlertDialog } from '@/components/ConfirmAlertDialog';
import type { AdminUser } from '@/services/adminClient';
import { useAdminPage } from './use-admin-page';
import { AdminUsersTable } from './admin-users-table';

export type User = AdminUser;

export default function AdminPage() {
  const {
    router,
    loading,
    showUsers,
    setShowUsers,
    users,
    error,
    editingUser,
    setEditingUser,
    newRole,
    setNewRole,
    logoutConfirmOpen,
    setLogoutConfirmOpen,
    userToDelete,
    setUserToDelete,
    deletingUser,
    handleLogout,
    confirmLogout,
    loadUsers,
    handleRoleChange,
    handleDeleteUser,
    confirmDeleteUser,
  } = useAdminPage();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b safe-top">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Admin Dashboard</h1>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <span className="hidden sm:inline text-sm text-gray-600">Administrador</span>
            <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-gray-900 px-2 py-2 sm:px-0 sm:py-0">Sair</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-2">Gerenciar Usuários</h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">Administrar anotadores e administradores</p>
            <button
              onClick={() => { setShowUsers(!showUsers); if (!showUsers) loadUsers(); }}
              className="w-full bg-sky-600 text-white py-3 rounded-lg hover:bg-sky-700 active:scale-[0.98] transition-transform"
            >
              {showUsers ? 'Fechar' : 'Gerenciar'}
            </button>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-2">Configurações Operacionais</h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">Configurações globais do sistema</p>
            <button className="w-full bg-gray-300 text-gray-500 py-3 rounded-lg cursor-not-allowed">
              Em breve
            </button>
          </div>
        </div>

        {showUsers && (
          <AdminUsersTable
            users={users}
            editingUser={editingUser}
            newRole={newRole}
            setNewRole={setNewRole}
            setEditingUser={setEditingUser}
            handleRoleChange={handleRoleChange}
            handleDeleteUser={handleDeleteUser}
          />
        )}

        <div className="mt-6 sm:mt-8">
          <button onClick={() => router.push('/dashboard')} className="text-sky-600 hover:text-sky-700">
            ← Voltar para Dashboard
          </button>
        </div>
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
