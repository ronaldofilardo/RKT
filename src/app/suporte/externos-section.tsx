'use client';

import { useEffect, useState } from 'react';

interface ExternalAthlete {
  id: string;
  name: string;
  club: string | null;
  city: string | null;
  state: string | null;
  gender: string | null;
  age: number | null;
  rankings: unknown;
  createdAt: string;
  createdByName: string | null;
  createdByEmail: string | null;
}

interface ExternalClub {
  club: string;
  city: string;
  state: string;
  status: string | null;
  inSystem: boolean;
}

function formatGender(gender: string | null): string {
  if (gender === 'MALE') return 'Masc';
  if (gender === 'FEMALE') return 'Fem';
  return '-';
}

function formatRankings(rankings: unknown): string {
  if (!rankings || typeof rankings !== 'object') return '-';
  const r = rankings as Record<string, any>;
  const entries = Object.entries(r).map(([type, val]) => {
    if (typeof val !== 'object' || val === null) return type;
    const cat = (val as any).category ?? '';
    const pos = (val as any).position ?? '';
    if (cat && pos) return `${type} ${cat} (${pos})`;
    if (cat) return `${type} ${cat}`;
    return type;
  });
  return entries.length > 0 ? entries.join(', ') : '-';
}

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

function clubStatusBadge(status: string | null, inSystem: boolean): React.ReactNode {
  if (!inSystem) {
    return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-telemetry-error/20 text-telemetry-error">Não cadastrado</span>;
  }
  const s = (status || '').toUpperCase();
  const variants: Record<string, string> = {
    PENDING: 'bg-telemetry-alert/20 text-telemetry-alert',
    ACTIVE: 'bg-telemetry-volt/20 text-telemetry-volt',
    SUSPENDED: 'bg-telemetry-error/20 text-telemetry-error',
  };
  const base = variants[s] ?? 'bg-telemetry-text-muted/20 text-telemetry-text-muted';
  const labels: Record<string, string> = {
    PENDING: 'Pendente',
    ACTIVE: 'Ativo',
    SUSPENDED: 'Suspenso',
  };
  const label = labels[s] ?? s;
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${base}`}>{label}</span>;
}

interface ExternosSectionProps {
  data: { athletes: ExternalAthlete[]; clubs: ExternalClub[]; totalAthletes: number; totalClubs: number } | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function ExternosSection({
  data, loading, error, onRetry,
}: ExternosSectionProps) {
  const [athletes, setAthletes] = useState<ExternalAthlete[]>([]);
  const [clubs, setClubs] = useState<ExternalClub[]>([]);

  useEffect(() => {
    if (data) {
      setAthletes(data.athletes);
      setClubs(data.clubs);
    }
  }, [data]);

  if (loading) {
    return (
      <div className="p-0 sm:p-6 space-y-6">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telemetry-blue"></div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-0 sm:p-6 space-y-6">
        <div className="bg-telemetry-error/10 border border-telemetry-error/20 text-telemetry-error p-6 rounded-xl max-w-md">
          <h2 className="font-bold mb-2">Erro</h2>
          <p>{error}</p>
          <button onClick={onRetry} className="mt-3 text-sm text-telemetry-blue hover:underline">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-telemetry-text-primary">Externos</h2>
        <p className="text-xs text-telemetry-text-muted">
          Atletas e clubes cadastrados em partidas como adversários, sem conta no sistema.
        </p>
      </div>

      {/* Seção A: Atletas Externos */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-telemetry-text-primary mb-2">
          Atletas Sem Conta ({data?.totalAthletes ?? athletes.length})
        </h3>
        <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead>
              <tr className="border-b border-telemetry-border/40 text-sm font-semibold text-telemetry-text-primary">
                <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Nome</th>
                <th className="px-3 pb-4 pt-4 hidden md:table-cell text-sm font-medium text-telemetry-text-primary">Clube</th>
                <th className="px-3 pb-4 pt-4 hidden lg:table-cell text-sm font-medium text-telemetry-text-primary">Cidade</th>
                <th className="px-3 pb-4 pt-4 hidden lg:table-cell text-sm font-medium text-telemetry-text-primary">Estado</th>
                <th className="px-3 pb-4 pt-4 hidden lg:table-cell text-sm font-medium text-telemetry-text-primary">Gênero</th>
                <th className="px-3 pb-4 pt-4 hidden lg:table-cell text-sm font-medium text-telemetry-text-primary">Idade</th>
                <th className="px-3 pb-4 pt-4 hidden lg:table-cell text-sm font-medium text-telemetry-text-primary">
                  Rankings <span className="text-[10px] text-telemetry-text-muted font-normal">(posição)</span>
                </th>
                <th className="px-3 pb-4 pt-4 hidden lg:table-cell text-sm font-medium text-telemetry-text-primary">Data Inserção</th>
                <th className="px-3 pb-4 pt-4 hidden lg:table-cell text-sm font-medium text-telemetry-text-primary">Criado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-telemetry-border/20">
              {athletes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-telemetry-text-muted">
                    Nenhum atleta externo encontrado.
                  </td>
                </tr>
              ) : (
                athletes.map((a) => (
                  <tr key={a.id} className="border-b border-telemetry-border/10 hover:bg-telemetry-elevated/30 transition-colors">
                    <td className="px-3 py-3 text-sm text-telemetry-text-primary">{a.name}</td>
                    <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden md:table-cell">
                      {a.club || '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden lg:table-cell">
                      {a.city || '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden lg:table-cell">
                      {a.state || '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden lg:table-cell">
                      {formatGender(a.gender)}
                    </td>
                    <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden lg:table-cell">
                      {a.age ?? '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden lg:table-cell">
                      {formatRankings(a.rankings)}
                    </td>
                    <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden lg:table-cell">
                      {formatDate(a.createdAt)}
                    </td>
                    <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden lg:table-cell">
                      {a.createdByName || a.createdByEmail || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Seção B: Clubes Externos */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-telemetry-text-primary mb-2">
          Clubes Mencionados ({data?.totalClubs ?? clubs.length})
        </h3>
        <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead>
              <tr className="border-b border-telemetry-border/40 text-sm font-semibold text-telemetry-text-primary">
                <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Clube</th>
                <th className="px-3 pb-4 pt-4 hidden lg:table-cell text-sm font-medium text-telemetry-text-primary">Cidade</th>
                <th className="px-3 pb-4 pt-4 hidden lg:table-cell text-sm font-medium text-telemetry-text-primary">Estado</th>
                <th className="px-3 pb-4 pt-4 hidden lg:table-cell text-sm font-medium text-telemetry-text-primary">Status</th>
                <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Atletas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-telemetry-border/20">
              {clubs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-telemetry-text-muted">
                    Nenhum clube externo mencionado.
                  </td>
                </tr>
              ) : (
                clubs.map((c) => {
                  const athleteCount = athletes.filter((a) => a.club === c.club).length;
                  return (
                    <tr key={c.club} className="border-b border-telemetry-border/10 hover:bg-telemetry-elevated/30 transition-colors">
                      <td className="px-3 py-3 text-sm text-telemetry-text-primary">{c.club}</td>
                      <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden lg:table-cell">
                        {c.city || '-'}
                      </td>
                      <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden lg:table-cell">
                        {c.state || '-'}
                      </td>
                      <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden lg:table-cell">
                        {clubStatusBadge(c.status, c.inSystem)}
                      </td>
                      <td className="px-3 py-3 text-sm text-telemetry-text-muted">{athleteCount}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
