import type { ReportData } from './report.types';
import { formatDate } from './report-view.helpers';

interface ReportStatsProps {
  report: ReportData;
  p1Points: number;
  p2Points: number;
  totalPoints: number;
}

export function ReportStats({ report, p1Points, p2Points, totalPoints }: ReportStatsProps) {
  const percent = (points: number) => Math.round((points / totalPoints) * 100) || 0;
  const p1 = report.summary?.player1;
  const p2 = report.summary?.player2;
  return (
    <section aria-label="Resumo estatístico" className="space-y-4 mb-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard value={p1Points} label={report.player1.name} detail={`${percent(p1Points)}% dos pontos`} color="text-telemetry-blue" />
        <StatCard value={totalPoints} label="Total de Pontos" detail={report.state === 'FINISHED' ? 'Partida finalizada' : formatDate(report.startedAt)} color="text-telemetry-text-primary" />
        <StatCard value={p2Points} label={report.player2.name} detail={`${percent(p2Points)}% dos pontos`} color="text-telemetry-error" />
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

function StatCard({ value, label, detail, color }: { value: number; label: string; detail: string; color: string }) {
  return <div className="bg-telemetry-card rounded-xl p-4 border border-white/10 text-center"><div className={`text-3xl font-black ${color}`}>{value}</div><div className="text-sm font-semibold text-telemetry-text-muted mt-1">{label}</div><div className="text-xs text-telemetry-text-muted/70 mt-1">{detail}</div></div>;
}

function MiniStat({ label, p1, p2, names }: { label: string; p1: number; p2: number; names: ReportData }) {
  return <div className="bg-telemetry-elevated rounded-lg border border-white/10 px-2 py-2 text-center" title={`${names.player1.name}: ${p1} · ${names.player2.name}: ${p2}`}><div className="text-[10px] text-telemetry-text-muted truncate">{label}</div><div className="text-sm font-bold"><span className="text-telemetry-blue">{p1}</span><span className="text-telemetry-text-muted/30 mx-1">–</span><span className="text-telemetry-error">{p2}</span></div></div>;
}
