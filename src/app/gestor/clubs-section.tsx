'use client';

import { useEffect, useState } from 'react';
import { ClubsTable, type Club } from './clubs-table';

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

  useEffect(() => { loadClubs(); }, []);

  const handleStatusChange = async (clubId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    try {
      const res = await fetch(`/api/gestor/clubs/${clubId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar status');
      setClubs((prev) => prev.map((c) => (c.id === clubId ? { ...c, status: newStatus } : c)));
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
      <ClubsTable clubs={clubs} onStatusChange={handleStatusChange} />
    </div>
  );
}
