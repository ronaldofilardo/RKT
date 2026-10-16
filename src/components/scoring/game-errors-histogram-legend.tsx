interface HistogramHeaderProps {
  player1Name: string;
  player2Name: string;
}

export function HistogramHeader({ player1Name, player2Name }: HistogramHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-semibold text-telemetry-text-primary tracking-wide">
        Erros por Game (Oscilação)
      </span>
      <div className="flex items-center gap-3 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-telemetry-blue inline-block" />
          <span className="text-telemetry-text-muted font-medium truncate max-w-[80px]">{player1Name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-telemetry-error inline-block" />
          <span className="text-telemetry-text-muted font-medium truncate max-w-[80px]">{player2Name}</span>
        </div>
      </div>
    </div>
  );
}

interface HistogramFooterProps {
  maxErrors: number;
}

export function HistogramFooter({ maxErrors }: HistogramFooterProps) {
  return (
    <div className="flex items-center justify-between text-[10px] text-telemetry-text-muted mt-0.5 px-1">
      <span>• Ponto amarelo indica quem sacou no game</span>
      <span>Escala máx: {maxErrors} erros/game</span>
    </div>
  );
}
