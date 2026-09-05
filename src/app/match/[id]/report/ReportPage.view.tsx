'use client';

import { useState } from 'react';
import type { ReportData } from './report.types';
import { MatchTimelineView } from '@/components/scoring/MatchTimelineView';
import { AdvancedStats } from '@/components/report/AdvancedStats';
import { downloadReportCsv } from './report-export';

type Props = {
  report: ReportData;
  matchId: string;
  p1Points: number;
  p2Points: number;
  totalPoints: number;
  onContinue: () => void;
  onDashboard: () => void;
};

type Tab = 'summary' | 'advanced' | 'timeline';

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleString('pt-BR') : '–';
}

export function ReportPageView({ report, matchId, p1Points, p2Points, totalPoints, onContinue, onDashboard }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('summary');

  return (
    <div className="min-h-screen bg-gray-50">
      <ReportHeader report={report} onContinue={onContinue} onDashboard={onDashboard} onExport={() => downloadReportCsv(report)} />
      <main className="max-w-7xl mx-auto px-6 py-6">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} hasAdvancedStats={!!report.advancedStats} />
        {activeTab === 'summary' && <ReportStats report={report} p1Points={p1Points} p2Points={p2Points} totalPoints={totalPoints} />}
        {activeTab === 'advanced' && report.advancedStats && (
          <AdvancedStats stats={report.advancedStats} player1Name={report.player1.name} player2Name={report.player2.name} />
        )}
        <IntegrityNotice report={report} />
        {activeTab === 'timeline' && <ReportTimeline report={report} matchId={matchId} onContinue={onContinue} />}
      </main>
    </div>
  );
}

function TabBar({ activeTab, onTabChange, hasAdvancedStats }: { activeTab: Tab; onTabChange: (tab: Tab) => void; hasAdvancedStats: boolean }) {
  const tabs: Array<{ id: Tab; label: string; disabled?: boolean }> = [
    { id: 'summary', label: 'Resumo' },
    { id: 'advanced', label: 'Estatísticas Avançadas', disabled: !hasAdvancedStats },
    { id: 'timeline', label: 'Timeline' },
  ];

  return (
    <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => !tab.disabled && onTabChange(tab.id)}
          disabled={tab.disabled}
          className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === tab.id
              ? 'bg-white text-gray-900 shadow-sm'
              : tab.disabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function ReportHeader({ report, onContinue, onDashboard, onExport }: { report: ReportData; onContinue: () => void; onDashboard: () => void; onExport: () => void }) {
  const stateLabel = report.state === 'FINISHED' ? 'Finalizada' : report.state === 'IN_PROGRESS' ? 'Em andamento' : 'Aguardando';
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Relatório da Partida</h1>
          <p className="text-sm text-gray-500">{report.player1.name} vs {report.player2.name} · {report.format.replace(/_/g, ' ')} · {stateLabel}</p>
          <p className="text-xs text-gray-400 mt-1">Início: {formatDate(report.startedAt)} · Fim: {formatDate(report.finishedAt)} · {report.scoreEditsCount ?? 0} correções</p>
          <p className="text-xs text-gray-400 mt-1">{[report.tournamentName, report.round, report.category, report.courtType].filter(Boolean).join(' · ') || 'Sem metadados adicionais'}{report.temperature != null ? ` · ${report.temperature}°` : ''}{report.humidity != null ? ` · ${report.humidity}% umidade` : ''}</p>
          {report.finishNote ? <p className="text-xs text-amber-700 mt-1">Nota de encerramento: {report.finishNote}</p> : null}
        </div>
        <div className="flex gap-3">
          {report.state !== 'FINISHED' && <button onClick={onContinue} className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-sm">Continuar Anotação</button>}
          <button onClick={onExport} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm">Exportar CSV</button>
          <button onClick={onDashboard} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm">← Dashboard</button>
        </div>
      </div>
    </header>
  );
}

function ReportStats({ report, p1Points, p2Points, totalPoints }: { report: ReportData; p1Points: number; p2Points: number; totalPoints: number }) {
  const percent = (points: number) => Math.round((points / totalPoints) * 100) || 0;
  const p1 = report.summary?.player1;
  const p2 = report.summary?.player2;
  return (
    <section aria-label="Resumo estatístico" className="space-y-4 mb-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard value={p1Points} label={report.player1.name} detail={`${percent(p1Points)}% dos pontos`} color="text-blue-600" />
        <StatCard value={totalPoints} label="Total de Pontos" detail={report.state === 'FINISHED' ? 'Partida finalizada' : formatDate(report.startedAt)} color="text-gray-800" />
        <StatCard value={p2Points} label={report.player2.name} detail={`${percent(p2Points)}% dos pontos`} color="text-red-600" />
      </div>
      {p1 && p2 && <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        <MiniStat label="Aces" p1={p1.aces} p2={p2.aces} names={report} />
        <MiniStat label="Winners" p1={p1.winners} p2={p2.winners} names={report} />
        <MiniStat label="Erros forçados" p1={p1.forcedErrors} p2={p2.forcedErrors} names={report} />
        <MiniStat label="Erros não forçados" p1={p1.unforcedErrors} p2={p2.unforcedErrors} names={report} />
        <MiniStat label="Duplas faltas" p1={p1.doubleFaults} p2={p2.doubleFaults} names={report} />
        <MiniStat label="Break points" p1={p1.breakPoints} p2={p2.breakPoints} names={report} />
        <MiniStat label="BP ganhos" p1={p1.breakPointsWon} p2={p2.breakPointsWon} names={report} />
        <MiniStat label="Sets registrados" p1={report.summary.sets.filter((set) => set.player1 > set.player2).length} p2={report.summary.sets.filter((set) => set.player2 > set.player1).length} names={report} />
      </div>}
    </section>
  );
}

function IntegrityNotice({ report }: { report: ReportData }) {
  const integrity = report.integrity;
  if (!integrity || integrity.status === 'OK') return null;
  return <aside className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status"><strong>Integridade do relatório: atenção.</strong><ul className="mt-1 list-disc pl-5">{integrity.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>;
}

function StatCard({ value, label, detail, color }: { value: number; label: string; detail: string; color: string }) {
  return <div className="bg-white rounded-xl p-4 border border-gray-200 text-center"><div className={`text-3xl font-black ${color}`}>{value}</div><div className="text-sm font-semibold text-gray-600 mt-1">{label}</div><div className="text-xs text-gray-400">{detail}</div></div>;
}

function MiniStat({ label, p1, p2, names }: { label: string; p1: number; p2: number; names: ReportData }) {
  return <div className="bg-white rounded-lg border border-gray-200 px-2 py-2 text-center" title={`${names.player1.name}: ${p1} · ${names.player2.name}: ${p2}`}><div className="text-[10px] text-gray-500 truncate">{label}</div><div className="text-sm font-bold"><span className="text-blue-600">{p1}</span><span className="text-gray-300 mx-1">–</span><span className="text-red-600">{p2}</span></div></div>;
}

function ReportTimeline({ report, matchId, onContinue }: { report: ReportData; matchId: string; onContinue: () => void }) {
  if (!report.timelinePoints.length) return <div className="bg-white rounded-xl border border-gray-200 p-12 text-center"><p className="text-gray-500">Nenhum ponto registrado nesta partida.</p>{report.state !== 'FINISHED' && <button onClick={onContinue} className="mt-4 text-sky-600 font-semibold underline">Iniciar anotação</button>}</div>;
  return <div className="bg-white rounded-xl border border-gray-200 p-4"><MatchTimelineView points={report.timelinePoints} player1Name={report.player1.name} player2Name={report.player2.name} matchId={matchId} /></div>;
}
