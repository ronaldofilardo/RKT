'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ReportPageView } from './ReportPage.view';
import type { ReportData } from './report.types';

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

  const totalPoints = report.timelinePoints.length;
  const p1Points = report.timelinePoints.filter(p => p.winner === 'PLAYER_1').length;
  const p2Points = report.timelinePoints.filter(p => p.winner === 'PLAYER_2').length;

  return (
    <ReportPageView
      report={report}
      matchId={matchId}
      p1Points={p1Points}
      p2Points={p2Points}
      totalPoints={totalPoints}
      onContinue={() => router.push(`/match/${matchId}/scoring`)}
      onDashboard={() => router.push('/dashboard')}
    />
  );
}
