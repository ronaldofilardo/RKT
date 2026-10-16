'use client';

import type { AdminUser } from '@/services/adminClient';

const ROLES = ['ADMIN', 'ANNOTATOR'];

interface AdminUsersTableProps {
  users: AdminUser[];
  editingUser: string | null;
  newRole: string;
  setNewRole: (v: string) => void;
  setEditingUser: (v: string | null) => void;
  handleRoleChange: (userId: string) => Promise<void>;
  handleDeleteUser: (u: AdminUser) => void;
}

/** Tabela de usuários cadastrados com edição de perfil e exclusão. */
export function AdminUsersTable({
  users,
  editingUser,
  newRole,
  setNewRole,
  setEditingUser,
  handleRoleChange,
  handleDeleteUser,
}: AdminUsersTableProps) {
  return (
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
              <th className="text-left px-4 sm:px-6 py-3 font-medium">CPF</th>
              <th className="text-left px-4 sm:px-6 py-3 font-medium">Perfil</th>
              <th className="text-left px-4 sm:px-6 py-3 font-medium">Clube</th>
              <th className="text-right px-4 sm:px-6 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 sm:px-6 py-3 font-medium">{u.name}</td>
                <td className="px-4 sm:px-6 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 sm:px-6 py-3 text-gray-500">{u.cpf || '-'}</td>
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
                      u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'
                    }`}>{u.role === 'ANNOTATOR' ? 'ANOTADOR' : u.role}</span>
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
                        Alterar Perfil
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u)}
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
  );
}
