'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { MatchTimelineView } from '@/components/scoring/MatchTimelineView';
import type { TimelinePoint, TennisFormat } from '@/core/scoring/types';

interface ReportData {
  matchId: string;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  format: TennisFormat;
  scoreState: unknown;
  timelinePoints: TimelinePoint[];
  state: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = use(params);
  const router = useRouter();

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch(`/api/matches/${matchId}/report`, {
      headers: { authorization: `Bearer ${token}` },
    })
      .then(async res => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Erro ao carregar relatório');
        }
        return res.json();
      })
      .then((data: ReportData) => {
        setReport(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [matchId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 font-semibold">{error || 'Relatório não encontrado'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-sky-600 underline"
          >
            Voltar ao dashboard
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return '–';
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPoints = report.timelinePoints.length;
  const p1Points = report.timelinePoints.filter(p => p.winner === 'PLAYER_1').length;
  const p2Points = report.timelinePoints.filter(p => p.winner === 'PLAYER_2').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Relatório da Partida</h1>
            <p className="text-sm text-gray-500">
              {report.player1.name} vs {report.player2.name}
              {' · '}
              {report.format.replace(/_/g, ' ')}
              {' · '}
              {report.state === 'FINISHED' ? '✅ Finalizada' : report.state === 'IN_PROGRESS' ? '🔴 Em andamento' : 'Aguardando'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/match/${matchId}/scoring`)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-sm"
            >
              📝 Continuar Anotação
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm"
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="text-3xl font-black text-blue-600">{p1Points}</div>
            <div className="text-sm font-semibold text-gray-600 mt-1">{report.player1.name}</div>
            <div className="text-xs text-gray-400">{Math.round((p1Points / totalPoints) * 100) || 0}% dos pontos</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="text-3xl font-black text-gray-800">{totalPoints}</div>
            <div className="text-sm font-semibold text-gray-600 mt-1">Total de Pontos</div>
            <div className="text-xs text-gray-400">{report.state === 'FINISHED' ? 'Partida finalizada' : formatDate(report.startedAt)}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="text-3xl font-black text-red-600">{p2Points}</div>
            <div className="text-sm font-semibold text-gray-600 mt-1">{report.player2.name}</div>
            <div className="text-xs text-gray-400">{Math.round((p2Points / totalPoints) * 100) || 0}% dos pontos</div>
          </div>
        </div>

        {report.timelinePoints.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Nenhum ponto registrado nesta partida.</p>
            <button
              onClick={() => router.push(`/match/${matchId}/scoring`)}
              className="mt-4 text-sky-600 font-semibold underline"
            >
              Iniciar anotação
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <MatchTimelineView
              points={report.timelinePoints}
              player1Name={report.player1.name}
              player2Name={report.player2.name}
            />
          </div>
        )}
      </main>
    </div>
  );
}