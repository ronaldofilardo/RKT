export interface MatchInfoData {
  tournamentName?: string | null;
  clubName?: string | null;
  round?: string | null;
  category?: string | null;
  courtType?: string | null;
  format?: string | null;
  temperature?: number | null;
  humidity?: number | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  state?: string | null;
  details?: string | null;
  finishNote?: string | null;
}

type InfoItem = { label?: string; value: string; isHighlight?: boolean };

const COURT_TYPE_LABELS: Record<string, string> = {
  GRASS: 'Grama', CLAY: 'Saibro', HARD: 'Piso duro', CARPET: 'Carpete', INDOOR: 'Indoor',
};

const STATE_LABELS: Record<string, string> = {
  FINISHED: 'Finalizada', IN_PROGRESS: 'Em andamento', SCHEDULED: 'Agendada', CANCELLED: 'Cancelada',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function buildInfoItems(info: MatchInfoData): InfoItem[] {
  const items: InfoItem[] = [];
  if (info.tournamentName) items.push({ label: 'Torneio', value: info.tournamentName });
  if (info.clubName) items.push({ label: 'Clube', value: info.clubName });
  if (info.round) items.push({ label: 'Rodada', value: info.round });
  if (info.category) items.push({ label: 'Categoria', value: info.category });
  if (info.courtType) items.push({ label: 'Quadra', value: COURT_TYPE_LABELS[info.courtType.toUpperCase()] ?? info.courtType });
  if (info.format) items.push({ label: 'Formato', value: info.format.replace(/_/g, ' ') });
  if (info.temperature != null) items.push({ label: 'Temp', value: `${info.temperature}°C` });
  if (info.humidity != null) items.push({ label: 'Umidade', value: `${info.humidity}%` });
  if (info.startedAt) items.push({ label: 'Início', value: formatDateTime(info.startedAt) });
  if (info.finishedAt) items.push({ label: 'Fim', value: formatDateTime(info.finishedAt) });
  if (info.state) items.push({ label: 'Status', value: STATE_LABELS[info.state] ?? info.state });
  if (info.details) items.push({ label: 'Detalhes', value: info.details, isHighlight: true });
  if (info.finishNote) items.push({ label: 'Nota', value: info.finishNote });
  return items;
}

export function MatchInfoLine({ info }: { info: MatchInfoData }) {
  const items = buildInfoItems(info);
  if (items.length === 0) return null;

  return (
    <div
      data-testid="timeline-match-info"
      className="mt-3 bg-telemetry-elevated/80 border border-white/10 rounded-lg px-3 py-2 text-[11px]"
    >
      {/* Linha 1: Título */}
      <div className="font-semibold text-telemetry-text-primary text-[11px] mb-2 flex items-center gap-1.5">
        <span>ℹ️ Informações da Partida</span>
      </div>
      {/* Linhas 2 e 3: Rótulos na linha 2 e Valores na linha 3 */}
      <div className="flex items-start gap-5 overflow-x-auto whitespace-nowrap scrollbar-thin pb-1">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col shrink-0 min-w-max">
            {/* Linha 2: Rótulo */}
            <span className="text-[10px] uppercase font-semibold tracking-wider text-telemetry-text-muted">
              {item.label}
            </span>
            {/* Linha 3: Valor */}
            <span
              className={
                item.isHighlight
                  ? "text-[11px] font-bold text-telemetry-volt mt-0.5"
                  : "text-[11px] font-medium text-telemetry-text-primary mt-0.5"
              }
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
