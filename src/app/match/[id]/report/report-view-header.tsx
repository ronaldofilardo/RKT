import type { ReportData } from './report.types';
import { formatDate } from './report-view.logic';

interface ReportHeaderProps {
  report: ReportData;
  onContinue: () => void;
  onDashboard: () => void;
  onExport: () => void;
}

export function ReportHeader({ report, onContinue, onDashboard, onExport }: ReportHeaderProps) {
  const stateLabel = report.state === 'FINISHED' ? 'Finalizada' : report.state === 'IN_PROGRESS' ? 'Em andamento' : 'Aguardando';
  const isDoubles = report.matchType === 'DOUBLES';
  const p1Name = isDoubles && report.player1Partner ? `${report.player1.name} / ${report.player1Partner.name}` : report.player1.name;
  const p2Name = isDoubles && report.player2Partner ? `${report.player2.name} / ${report.player2Partner.name}` : report.player2.name;

  const courtTypeMap: Record<string, string> = {
    GRASS: 'Grama',
    CLAY: 'Saibro',
    HARD: 'Piso duro',
    CARPET: 'Carpete',
    INDOOR: 'Indoor',
  };

  const metaItems = [report.tournamentName, report.round, report.category]
    .filter(Boolean)
    .filter((v, i, arr) => i === 0 || v !== arr[i - 1]);

  const courtLabel = report.courtType ? courtTypeMap[report.courtType.toUpperCase()] ?? report.courtType : null;
  if (courtLabel) metaItems.push(courtLabel);

  return (
    <header className="sticky top-0 z-30 bg-telemetry-card/95 backdrop-blur-md border-b border-white/10 px-6 py-4 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-telemetry-text-primary">Relatório da Partida</h1>
          <p className="text-sm text-telemetry-text-muted mt-1">
            <span className="font-semibold text-telemetry-blue">P1</span> {p1Name} vs <span className="font-semibold text-telemetry-error">P2</span> {p2Name} · {isDoubles ? 'Duplas · ' : ''}{report.format.replace(/_/g, ' ')} · {stateLabel}
          </p>
          <p className="text-xs text-telemetry-text-muted/70 mt-1">Início: {formatDate(report.startedAt)} · Fim: {formatDate(report.finishedAt)}</p>
          <p className="text-xs text-telemetry-text-muted/70 mt-1">
            {metaItems.length > 0 ? metaItems.join(' · ') : 'Sem metadados adicionais'}
            {report.temperature != null ? ` · ${report.temperature}°` : ''}
            {report.humidity != null ? ` · ${report.humidity}% umidade` : ''}
          </p>
          {report.finishNote ? <p className="text-xs text-telemetry-alert mt-1">Nota de encerramento: {report.finishNote}</p> : null}
        </div>
        <div className="flex gap-3">
          {report.state !== 'FINISHED' && <button onClick={onContinue} className="px-4 py-2 bg-telemetry-blue hover:opacity-90 text-white font-semibold rounded-xl text-sm transition-opacity shadow-sm">Continuar Anotação</button>}
          <button onClick={onExport} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-opacity shadow-sm">Exportar CSV</button>
          <button onClick={onDashboard} className="px-4 py-2 bg-transparent border border-white/10 hover:bg-white/5 text-telemetry-text-primary font-semibold rounded-xl text-sm transition-colors">← Dashboard</button>
        </div>
      </div>
    </header>
  );
}
