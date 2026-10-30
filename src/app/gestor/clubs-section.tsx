'use client';

import { useEffect, useState } from 'react';

interface Club {
  id: string;
  name: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  cnpj: string;
  email: string;
  createdAt: string;
}

export function ClubsSection() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClubs = async () => {
    try {
      const res = await fetch('/api/gestor/clubs');
      if (!res.ok) throw new Error('Falha ao carregar clubes');
      const data = await res.json();
      setClubs(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clubes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClubs();
  }, []);

  const handleStatusChange = async (clubId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    try {
      const res = await fetch(`/api/gestor/clubs/${clubId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar status');
      setClubs((prev) =>
        prev.map((c) => (c.id === clubId ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar status');
    }
  };

  if (loading)
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telemetry-blue" />
      </div>
    );
  if (error)
    return (
      <div className="p-6 bg-telemetry-error/10 border border-telemetry-error/20 text-telemetry-error rounded-xl max-w-md">
        <h2 className="font-bold mb-2">Erro</h2>
        <p>{error}</p>
      </div>
    );

  return (
    <div className="p-0 sm:p-6 space-y-6">
      <h2 className="text-lg font-semibold text-telemetry-text-primary">Clubes & CTs</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-telemetry-border/20">
              <th className="text-left py-3 px-4 font-medium text-telemetry-text-muted">Nome</th>
              <th className="text-left py-3 px-4 font-medium text-telemetry-text-muted">CNPJ</th>
              <th className="text-left py-3 px-4 font-medium text-telemetry-text-muted">E-mail</th>
              <th className="text-left py-3 px-4 font-medium text-telemetry-text-muted">Status</th>
              <th className="text-left py-3 px-4 font-medium text-telemetry-text-muted">Ações</th>
            </tr>
          </thead>
          <tbody>
            {clubs.map((club) => (
              <tr key={club.id} className="border-b border-telemetry-border/10 hover:bg-telemetry-elevated/20">
                <td className="py-3 px-4 text-telemetry-text-primary">{club.name}</td>
                <td className="py-3 px-4 text-telemetry-text-muted font-mono">{club.cnpj}</td>
                <td className="py-3 px-4 text-telemetry-text-muted">{club.email}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      club.status === 'ACTIVE'
                        ? 'bg-green-100/30 text-green-700'
                        : club.status === 'SUSPENDED'
                          ? 'bg-red-100/30 text-red-700'
                          : 'bg-yellow-100/30 text-yellow-700'
                    }`}
                  >
                    {club.status === 'ACTIVE' ? 'Ativo' : club.status === 'SUSPENDED' ? 'Suspenso' : 'Pendente'}
                  </span>
                </td>
                <td className="py-3 px-4 space-x-2">
                  {club.status !== 'ACTIVE' && (
                    <button
                      onClick={() => handleStatusChange(club.id, 'ACTIVE')}
                      className="text-xs px-2 py-1 rounded bg-sky-500/20 text-sky-600 hover:bg-sky-500/30 font-medium"
                    >
                      Ativar
                    </button>
                  )}
                  {club.status !== 'SUSPENDED' && (
                    <button
                      onClick={() => handleStatusChange(club.id, 'SUSPENDED')}
                      className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-600 hover:bg-red-500/30 font-medium"
                    >
                      Bloquear
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clubs.length === 0 && (
          <div className="text-center py-8 text-telemetry-text-muted">Nenhum clube disponível.</div>
        )}
      </div>
    </div>
  );
}
