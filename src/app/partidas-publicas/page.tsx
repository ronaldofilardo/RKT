'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardChrome } from '@/app/dashboard/components/DashboardChrome';
import { useAreaPath } from '@/hooks/use-area-path';
import { usePublicMatchPool, type PublicPoolMatch } from './usePublicMatchPool';
import { PublicPoolList } from './public-pool-list';

interface AnnotateResponse {
  matchId?: string;
  message?: string;
  details?: { matchId?: string } | null;
}

export default function PublicMatchesPage() {
  const pool = usePublicMatchPool();
  const router = useRouter();
  const toAreaPath = useAreaPath();
  const [annotatingId, setAnnotatingId] = useState<string | null>(null);
  const [conflict, setConflict] = useState<{ templateId: string; matchId: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function annotate(match: PublicPoolMatch) {
    setAnnotatingId(match.id);
    setConflict(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/matches/pool/${match.id}/annotate`, { method: 'POST' });
      const json = (await res.json().catch(() => ({}))) as AnnotateResponse;

      if (res.status === 201 && json.matchId) {
        router.push(toAreaPath(`/match/${json.matchId}/scoring`) as never);
        return;
      }

      if (res.status === 409 && json.details?.matchId) {
        setConflict({ templateId: match.id, matchId: json.details.matchId });
        setNotice(json.message ?? 'Você já está anotando esta partida.');
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
      <DashboardChrome title="Partidas Públicas" />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold">Partidas Públicas</h1>
          <p className="text-sm text-telemetry-text-muted">
            Escolha um cartaz e crie sua própria anotação. Cada anotação é isolada e soberana.
          </p>
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
          <div className="rounded-xl border border-amber-400/40 bg-telemetry-card p-4 space-y-2" role="status">
            <p className="text-sm text-telemetry-text-primary">{notice}</p>
            {conflict && (
              <button
                type="button"
                onClick={() => router.push(toAreaPath(`/match/${conflict.matchId}/scoring`) as never)}
                className="rounded-lg bg-telemetry-volt px-4 py-2 text-sm font-semibold text-telemetry-base"
              >
                Continuar anotação
              </button>
            )}
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
