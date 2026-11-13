'use client';

import type { UserItem } from './types';
import { formatDate } from './externos-formatters';

interface AvulsoUsersTableProps {
  users: UserItem[];
  emptyMessage: string;
  title?: string;
}

/** Lista de contas avulsas (treinadores/espectadores) usada como filtro da aba. */
export function AvulsoUsersTable({ users, emptyMessage, title }: AvulsoUsersTableProps) {
  return (
    <section className="space-y-3">
      {title && (
        <h3 className="text-sm font-semibold text-telemetry-text-primary">
          {title} ({users.length})
        </h3>
      )}
      <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left border-collapse">
          <thead>
            <tr className="border-b border-telemetry-border/40 text-sm font-semibold text-telemetry-text-primary">
              <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Nome</th>
              <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">E-mail</th>
              <th className="px-3 pb-4 pt-4 hidden md:table-cell text-sm font-medium text-telemetry-text-primary">CPF</th>
              <th className="px-3 pb-4 pt-4 hidden md:table-cell text-sm font-medium text-telemetry-text-primary">Status</th>
              <th className="px-3 pb-4 pt-4 hidden lg:table-cell text-sm font-medium text-telemetry-text-primary">Criado em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-telemetry-border/20">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-telemetry-text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-telemetry-border/10 hover:bg-telemetry-elevated/30 transition-colors">
                  <td className="px-3 py-3 text-sm text-telemetry-text-primary">{u.name}</td>
                  <td className="px-3 py-3 text-sm text-telemetry-text-muted">{u.email}</td>
                  <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden md:table-cell">{u.cpf}</td>
                  <td className="px-3 py-3 text-sm hidden md:table-cell">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        u.isActive
                          ? 'bg-telemetry-volt/20 text-telemetry-volt'
                          : 'bg-telemetry-text-muted/20 text-telemetry-text-muted'
                      }`}
                    >
                      {u.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden lg:table-cell">
                    {formatDate(u.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
