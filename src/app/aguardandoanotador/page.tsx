'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AguardandoAnotadorPage() {
  const router = useRouter();
  const [matchId, setMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('matchId');
    setMatchId(id);
    if (!id) router.replace('/dashboard');
  }, [router]);

  useEffect(() => {
    if (!matchId) return;

    const token = sessionStorage.getItem('access_token');

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/matches/${matchId}`, {
          headers: { authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('MATCH_NOT_FOUND');
        const match = await res.json();
        if (match.openForAnnotation || match.state === 'IN_PROGRESS') {
          router.push(`/match/${matchId}/scoring`);
        }
      } catch {
        setError('Erro ao verificar partida');
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
        <p className="text-gray-700 mt-6 text-lg font-semibold">Aguardando anotador...</p>
        <p className="text-gray-400 text-sm mt-2 leading-relaxed">
          A página será redirecionada automaticamente quando um anotador iniciar a sessão.
        </p>
        <p className="text-gray-300 text-xs mt-4">
          Aguardando há {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
        </p>
        {error && (
          <p className="text-red-500 text-sm mt-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 text-sky-600 hover:text-sky-700 underline text-sm"
        >
          Voltar ao dashboard
        </button>
      </div>
    </div>
  );
}
