'use client';

import type { AdminUser } from '@/services/adminClient';
import { PROFILE_OPTIONS, getProfileBadgeClass, getInitialRole } from './admin-profile-options';

interface AdminUsersTableProps {
  users: AdminUser[];
  editingUser: string | null;
  newRole: string;
  setNewRole: (v: string) => void;
  setEditingUser: (v: string | null) => void;
  updateUserRole: (userId: string) => Promise<void>;
  removeUserAccount: (u: AdminUser) => void;
}

/** Tabela de usuários cadastrados com contraste nítido, edição de perfil e exclusão. */
export function AdminUsersTable({
  users, editingUser, newRole, setNewRole, setEditingUser, updateUserRole, removeUserAccount,
}: AdminUsersTableProps) {
  return (
    <div className="mt-6 sm:mt-8 bg-telemetry-card rounded-lg shadow-sm border border-telemetry-border/20 overflow-hidden text-telemetry-text-primary">
      <div className="px-4 sm:px-6 py-4 border-b border-telemetry-border/20 bg-telemetry-elevated/50">
        <h3 className="text-lg font-bold text-telemetry-text-primary">Usuários Cadastrados</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-telemetry-text-primary">
          <thead className="bg-telemetry-elevated/30 text-telemetry-text-muted border-b border-telemetry-border/20">
            <tr>
              <th className="text-left px-4 sm:px-6 py-3 font-semibold text-telemetry-text-primary">Nome</th>
              <th className="text-left px-4 sm:px-6 py-3 font-semibold text-telemetry-text-primary">Email</th>
              <th className="text-left px-4 sm:px-6 py-3 font-semibold text-telemetry-text-primary">CPF</th>
              <th className="text-left px-4 sm:px-6 py-3 font-semibold text-telemetry-text-primary">Perfil</th>
              <th className="text-left px-4 sm:px-6 py-3 font-semibold text-telemetry-text-primary">Clube</th>
              <th className="text-right px-4 sm:px-6 py-3 font-semibold text-telemetry-text-primary">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-telemetry-border/10">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-telemetry-elevated/30 text-telemetry-text-primary">
                <td className="px-4 sm:px-6 py-3 font-medium text-telemetry-text-primary">{u.name}</td>
                <td className="px-4 sm:px-6 py-3 text-telemetry-text-muted">{u.email}</td>
                <td className="px-4 sm:px-6 py-3 text-telemetry-text-muted">{u.cpf || '-'}</td>
                <td className="px-4 sm:px-6 py-3">
                  {editingUser === u.id ? (
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="border border-telemetry-border bg-telemetry-card text-telemetry-text-primary rounded px-2 py-1 text-xs"
                    >
                      {PROFILE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getProfileBadgeClass(u.profile, u.role)}`}>
                      {u.profile || (u.role === 'ANNOTATOR' ? 'ANOTADOR' : u.role)}
                    </span>
                  )}
                </td>
                <td className="px-4 sm:px-6 py-3 text-telemetry-text-muted">{u.club || '-'}</td>
                <td className="px-4 sm:px-6 py-3 text-right whitespace-nowrap">
                  {editingUser === u.id ? (
                    <>
                      <button onClick={() => updateUserRole(u.id)} className="text-xs font-semibold text-telemetry-volt hover:underline">Salvar</button>
                      <button onClick={() => setEditingUser(null)} className="text-xs text-telemetry-text-muted hover:underline ml-2">Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setEditingUser(u.id); setNewRole(getInitialRole(u.profile, u.role)); }}
                        className="text-xs font-semibold text-telemetry-blue hover:underline"
                      >
                        Alterar Perfil
                      </button>
                      <button onClick={() => removeUserAccount(u)} className="text-xs font-semibold text-telemetry-error hover:underline ml-2">
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
