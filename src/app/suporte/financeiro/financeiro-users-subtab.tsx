'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { FinancialUserItem } from './financeiro-types';
import { FinanceiroUserRow } from './financeiro-user-row';

export function FinanceiroUsersSubtab() {
  const [users, setUsers] = useState<FinancialUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');

  useEffect(() => {
    fetch('/api/suporte/financeiro/users')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUsers(data?.items || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        search === '' ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.cpf && u.cpf.includes(search));
      const matchStatus =
        statusFilter === 'TODOS' ||
        (statusFilter === 'FREE_TRIAL' && (u.status === 'FREE_TRIAL' || u.status === 'LAST_FREE')) ||
        u.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [users, search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-telemetry-card p-3 rounded-xl border border-telemetry-border/20">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail ou CPF..."
          className="w-full sm:w-80 bg-telemetry-elevated border border-telemetry-border/20 rounded-lg px-3 py-1.5 text-xs text-telemetry-text-primary placeholder-telemetry-text-muted focus:outline-none focus:border-telemetry-blue"
        />
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto">
          {['TODOS', 'ACTIVE', 'FREE_TRIAL', 'EXPIRED', 'PAST_DUE'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-telemetry-blue text-white'
                  : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-telemetry-text-primary'
              }`}
            >
              {st === 'TODOS' ? 'Todos' : st === 'ACTIVE' ? 'Ativos' : st === 'FREE_TRIAL' ? 'Degustação' : st === 'EXPIRED' ? 'Restritos' : 'Em Atraso'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-telemetry-card border border-telemetry-border/20 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-telemetry-border/20 bg-telemetry-elevated/60 text-[11px] uppercase tracking-wider text-telemetry-text-muted">
              <th className="p-3">Usuário</th>
              <th className="p-3">Perfil</th>
              <th className="p-3">Status / Cota</th>
              <th className="p-3">Plano</th>
              <th className="p-3">Forma Pagto</th>
              <th className="p-3">Mensalidade</th>
              <th className="p-3">Vencimento</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center text-sm text-telemetry-text-muted">Carregando usuários...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-sm text-telemetry-text-muted">Nenhum usuário encontrado com os filtros selecionados.</td></tr>
            ) : (
              filtered.map((user) => <FinanceiroUserRow key={user.id} user={user} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
