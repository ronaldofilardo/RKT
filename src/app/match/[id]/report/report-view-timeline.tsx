import type { ReportData } from './report.types';
import { MatchTimelineView } from '@/components/scoring/MatchTimelineView';

interface IntegrityNoticeProps {
  report: ReportData;
}

export function IntegrityNotice({ report }: IntegrityNoticeProps) {
  const integrity = report.integrity;
  if (!integrity || integrity.status === 'OK') return null;
  return <aside className="mb-4 rounded-lg border border-telemetry-alert/30 bg-telemetry-alert/10 px-4 py-3 text-sm text-telemetry-alert" role="status"><strong>Integridade do relatório: atenção.</strong><ul className="mt-1 list-disc pl-5">{integrity.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>;
}

interface ReportTimelineProps {
  report: ReportData;
  matchId: string;
  onContinue: () => void;
}

export function ReportTimeline({ report, matchId, onContinue }: ReportTimelineProps) {
  if (!report.timelinePoints.length) return <div className="bg-telemetry-card rounded-xl border border-white/10 p-12 text-center"><p className="text-telemetry-text-muted">Nenhum ponto registrado nesta partida.</p>{report.state !== 'FINISHED' && <button onClick={onContinue} className="mt-4 text-telemetry-blue font-semibold underline">Iniciar anotação</button>}</div>;
  return (
    <div className="bg-telemetry-card rounded-xl border border-white/10 p-4">
      <MatchTimelineView
        points={report.timelinePoints}
        player1Name={report.player1.name}
        player2Name={report.player2.name}
        matchId={matchId}
        hideFilters
        showFinalResult
        scoreState={report.scoreState}
        comments={report.comments}
        matchInfo={{
          tournamentName: report.tournamentName,
          round: report.round,
          category: report.category,
          courtType: report.courtType,
          format: report.format,
          temperature: report.temperature,
          humidity: report.humidity,
          startedAt: report.startedAt,
          finishedAt: report.finishedAt,
          state: report.state,
          details: report.details,
          finishNote: report.finishNote,
        }}
      />
    </div>
  );
}
