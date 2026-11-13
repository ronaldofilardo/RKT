'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAreaPath } from '@/hooks/use-area-path';
import type { DashboardMatchPayload } from './match-card-types';

interface AnnotateResponse {
  matchId?: string;
  state?: string;
  message?: string;
  details?: { matchId?: string } | null;
}

/**
 * Ação principal de um cartaz (`isTemplate`/`isPublicTemplate`).
 * Cria — ou reabre — a anotação soberana do usuário via
 * `POST /api/matches/[id]/annotate` (`mode: 'resolve'`) e leva à pontuação.
 * O cartaz em si nunca navega para relatório/pontuação: `canReadMatch` nega
 * leitura de templates, então clicar no card geraria 403 FORBIDDEN.
 */
export function MatchCardAnnotateButton({ match }: { match: DashboardMatchPayload }) {
  const router = useRouter();
  const toAreaPath = useAreaPath();
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const annotate = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (pending) return;
    setPending(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/matches/${match.id}/annotate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'resolve' }),
      });
      const json = (await res.json().catch(() => ({}))) as AnnotateResponse;
      const targetId = json.matchId ?? json.details?.matchId;
      if (!res.ok || !targetId) {
        setErrorMessage(json.message ?? 'Não foi possível iniciar a anotação.');
        return;
      }
      const target = json.state === 'FINISHED' ? `/match/${targetId}/report` : `/match/${targetId}/scoring`;
      router.push(toAreaPath(target) as never);
    } catch {
      setErrorMessage('Não foi possível iniciar a anotação.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        data-testid={`annotate-template-${match.id}`}
        onClick={annotate}
        disabled={pending}
        className="rounded-lg bg-telemetry-volt px-3 py-1.5 text-xs font-bold text-telemetry-base transition-colors hover:opacity-90 disabled:opacity-60"
      >
        {pending ? 'Abrindo...' : 'Anotar minha versão'}
      </button>
      {errorMessage && (
        <span role="alert" className="max-w-[14rem] text-right text-xs text-red-500">
          {errorMessage}
        </span>
      )}
    </div>
  );
}
