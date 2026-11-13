'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardChrome } from '@/app/dashboard/components/DashboardChrome';
import { useAreaPath } from '@/hooks/use-area-path';
import { usePublicMatchPool, type PoolTabScope, type PublicPoolMatch } from './usePublicMatchPool';
import { PublicPoolList } from './public-pool-list';

interface AnnotateResponse {
  matchId?: string;
  message?: string;
  details?: { matchId?: string } | null;
}

export default function PublicMatchesPage() {
  const [scope, setScope] = useState<PoolTabScope>('public');
  const pool = usePublicMatchPool(scope);
  const router = useRouter();
  const toAreaPath = useAreaPath();
  const [annotatingId, setAnnotatingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function annotate(match: PublicPoolMatch) {
    if (match.myAnnotationId) {
      router.push(toAreaPath(`/match/${match.myAnnotationId}/scoring`) as never);
      return;
    }
    setAnnotatingId(match.id);
    setNotice(null);
    try {
      const res = await fetch(`/api/matches/${match.id}/annotate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'resolve' }),
      });
      const json = (await res.json().catch(() => ({}))) as AnnotateResponse;
      const targetId = json.matchId ?? json.details?.matchId;
      if ((res.status === 201 || res.status === 200 || res.status === 409) && targetId) {
        router.push(toAreaPath(`/match/${targetId}/scoring`) as never);
        return;
      }
      setNotice(json.message ?? 'Não foi possível iniciar a anotação.');
    } catch {
      setNotice('Não foi possível iniciar a anotação.');
    } finally {
      setAnnotatingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-telemetry-base text-telemetry-text-primary">
      <DashboardChrome title="Partidas para Anotar" />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold">Partidas para Anotar</h1>
          <p className="text-sm text-telemetry-text-muted">
            Escolha uma partida pública ou do seu círculo e crie sua própria anotação isolada.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setScope('public')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${scope === 'public' ? 'bg-telemetry-volt text-telemetry-base' : 'bg-telemetry-elevated text-telemetry-text-muted'}`}>
              🌐 Pool Público
            </button>
            <button type="button" onClick={() => setScope('private')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${scope === 'private' ? 'bg-telemetry-volt text-telemetry-base' : 'bg-telemetry-elevated text-telemetry-text-muted'}`}>
              🔒 Meu Círculo (Clube / Envolvidos)
            </button>
          </div>
          <input
            type="search"
            value={pool.search}
            onChange={(event) => pool.setSearch(event.target.value)}
            placeholder="Buscar por atleta, torneio, clube ou categoria"
            aria-label="Buscar partidas públicas"
            className="w-full px-3 py-2 border border-white/10 rounded-lg bg-telemetry-elevated text-telemetry-text-primary placeholder-telemetry-text-muted/50"
          />
        </header>

        {notice && (
          <div className="rounded-xl border border-amber-400/40 bg-telemetry-card p-4" role="status">
            <p className="text-sm text-telemetry-text-primary">{notice}</p>
          </div>
        )}

        <PublicPoolList
          matches={pool.matches}
          loading={pool.loading}
          loadingMore={pool.loadingMore}
          error={pool.error}
          hasMore={pool.hasMore}
          annotatingId={annotatingId}
          onAnnotate={annotate}
          onLoadMore={pool.loadMore}
          onRetry={pool.reload}
        />
      </main>
    </div>
  );
}
