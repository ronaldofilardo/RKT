'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AppRouteInput } from '@/lib/app-router';
import { matchesClient } from '@/services/matchesClient';
import { logger } from '@/lib/logger';
import { homeForProfileString } from '@/core/access/home';

export default function AguardandoAnotadorPage() {
  const router = useRouter();
  const [matchId, setMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  logger.info("[AguardandoAnotadorPage] mount matchId=", matchId);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('matchId');
    setMatchId(id);
    if (!id) router.replace(homeForProfileString(sessionStorage.getItem('user_role')) as any);
  }, [router]);

  useEffect(() => {
    if (!matchId) return;

    const poll = setInterval(async () => {
      try {
        const token = sessionStorage.getItem('access_token');
        const match = await matchesClient.getMatch(matchId, token) as {
          openForAnnotation?: boolean;
          state?: string;
        };
        if (match.openForAnnotation || match.state === 'IN_PROGRESS') {
          const userRole = sessionStorage.getItem('user_role');
          const isScorerOrStaff = userRole === 'ADMIN';
          if (isScorerOrStaff) {
            router.push(`/match/${matchId}/scoring` as AppRouteInput);
          } else {
            router.push(`/match/${matchId}` as AppRouteInput);
          }
        }
      } catch {
        setError('Não foi possível verificar o status. Tentando novamente...');
      }
    }, 3000);

    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);

    return () => {
      clearInterval(poll);
      clearInterval(timer);
    };
  }, [matchId, router]);

  if (!matchId) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-sky-200 border-t-sky-600 mx-auto" />
        <p className="text-gray-700 mt-6 text-lg font-semibold">Aguardando o início da partida</p>
        <p className="text-gray-400 text-sm mt-2 leading-relaxed">
          Você será redirecionado assim que a partida começar.
        </p>
        <p className="text-gray-300 text-xs mt-4">
          Esperando há {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
        </p>
        {error && (
          <p className="text-red-500 text-sm mt-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
        <button
          onClick={() => router.push(homeForProfileString(sessionStorage.getItem('user_role')) as any)}
          className="mt-6 text-sky-600 hover:text-sky-700 underline text-sm"
        >
          ← Voltar
        </button>
      </div>
    </div>
  );
}
