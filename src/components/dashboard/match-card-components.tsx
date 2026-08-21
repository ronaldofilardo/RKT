
const FORMAT_LABELS: Record<string, string> = {
  BEST_OF_3: 'Melhor de 3 Sets',
  BEST_OF_3_MATCH_TB: 'Melhor de 3 - TB 3º',
  BEST_OF_5: 'Melhor de 5 Sets',
  BEST_OF_3_NO_AD: 'Melhor de 3 - No Ad',
  SHORT_SET_2V2_NO_AD: 'Sets Curtos 2/2',
  MATCH_TB_10: 'Match Tie-break',
  PRO_SET_8: 'Set Profissional 8',
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendada',
  IN_PROGRESS: 'Em Andamento',
  FINISHED: 'Finalizada',
  CANCELLED: 'Cancelada',
};

interface MatchStatusBadgeProps {
  isSuspended: boolean;
  state: string;
}

export function MatchStatusBadge({ isSuspended, state }: MatchStatusBadgeProps) {
  return (
    <span
      className={`text-xs font-semibold px-2 py-1 rounded-full ${
        isSuspended ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
      }`}
    >
      {isSuspended ? 'Suspensa' : STATUS_LABELS[state] || state}
    </span>
  );
}

interface MatchActionsProps {
  match: any;
  onReport?: (match: any) => void;
  onFinish?: (match: any) => void;
  onDelete?: (match: any) => void;
}

export function MatchActions({ match, onReport, onFinish, onDelete }: MatchActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {onReport && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReport(match);
          }}
          className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
          title="Ver relatório"
        >
          📊
        </button>
      )}
      {match.state === 'IN_PROGRESS' && onFinish && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFinish(match);
          }}
          className="text-xs text-green-600 hover:text-green-700 transition-colors"
          title="Encerrar partida"
        >
          ✓
        </button>
      )}
      {(match.state === 'SCHEDULED' || match.state === 'IN_PROGRESS') && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(match);
          }}
          className="text-xs text-red-600 hover:text-red-700 transition-colors"
          title="Excluir partida"
        >
          🗑
        </button>
      )}
    </div>
  );
}

interface FormatLabelProps {
  format: string;
}

export function FormatLabel({ format }: FormatLabelProps) {
  return (
    <span className="text-xs text-gray-500">
      {FORMAT_LABELS[format] || format}
    </span>
  );
}
