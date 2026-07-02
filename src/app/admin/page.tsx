'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  club: string | null;
  createdAt: string;
}

const ROLES = ['ADMIN', 'GESTOR', 'COACH', 'ATHLETE', 'SPECTATOR'];

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUsers, setShowUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('');

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;

  useEffect(() => {
    const userRole = sessionStorage.getItem('user_role');
    const accessToken = sessionStorage.getItem('access_token');

    if (!userRole || !accessToken) {
      router.push('/login');
      return;
    }

    if (userRole !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    setUser({ role: userRole });
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    if (!confirm('Tem certeza que deseja sair?')) return;
    sessionStorage.clear();
    router.push('/login');
  };

  const loadUsers = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erro ao carregar usuários');
      const data = await res.json();
      setUsers(data.users);
    } catch {
      setError('Erro ao carregar usuários');
    }
  }, [token]);

  const handleRoleChange = async (userId: string) => {
    if (!newRole) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar role');
      setEditingUser(null);
      setNewRole('');
      await loadUsers();
    } catch {
      setError('Erro ao atualizar role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erro ao excluir usuário');
      await loadUsers();
    } catch {
      setError('Erro ao excluir usuário');
    }
  };

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
            <p className="text-gray-600 mb-4 text-sm sm:text-base">Administrar usuários e permissões</p>
            <button
              onClick={() => { setShowUsers(!showUsers); if (!showUsers) loadUsers(); }}
              className="w-full bg-sky-600 text-white py-3 rounded-lg hover:bg-sky-700 active:scale-[0.98] transition-transform"
            >
              {showUsers ? 'Fechar' : 'Gerenciar'}
            </button>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-2">Configurações</h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">Configurações do sistema</p>
            <button className="w-full bg-gray-300 text-gray-500 py-3 rounded-lg cursor-not-allowed">
              Em breve
            </button>
          </div>
        </div>

        {showUsers && (
          <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold">Usuários Cadastrados</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 sm:px-6 py-3 font-medium">Nome</th>
                    <th className="text-left px-4 sm:px-6 py-3 font-medium">Email</th>
                    <th className="text-left px-4 sm:px-6 py-3 font-medium">Role</th>
                    <th className="text-left px-4 sm:px-6 py-3 font-medium">Clube</th>
                    <th className="text-right px-4 sm:px-6 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-3">{u.name}</td>
                      <td className="px-4 sm:px-6 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 sm:px-6 py-3">
                        {editingUser === u.id ? (
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="border rounded px-2 py-1 text-xs"
                          >
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                            u.role === 'COACH' ? 'bg-blue-100 text-blue-700' :
                            u.role === 'GESTOR' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>{u.role}</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-gray-500">{u.club || '-'}</td>
                      <td className="px-4 sm:px-6 py-3 text-right whitespace-nowrap">
                        {editingUser === u.id ? (
                          <>
                            <button onClick={() => handleRoleChange(u.id)} className="text-xs text-green-600 hover:underline">Salvar</button>
                            <button onClick={() => setEditingUser(null)} className="text-xs text-gray-500 hover:underline ml-2">Cancelar</button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => { setEditingUser(u.id); setNewRole(u.role); }}
                              className="text-xs text-sky-600 hover:underline"
                            >
                              Alterar Role
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-xs text-red-600 hover:underline ml-2"
                            >
                              Excluir
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 sm:mt-8">
          <button onClick={() => router.push('/dashboard')} className="text-sky-600 hover:text-sky-700">
            ← Voltar para Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}