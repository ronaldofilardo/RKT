'use client';

interface Props {
  title: string;
  summary: string;
  live: boolean;
  onExpand: () => void;
  onClose: () => void;
}

/** Janela minimizada: título + placar. Toque/clique expande. */
export function FloatingSpectatorPill({ title, summary, live, onExpand, onClose }: Props) {
  return (
    <div className="pointer-events-auto flex items-center max-w-full rounded-full bg-telemetry-card text-telemetry-text-primary border border-telemetry-border/30 shadow-lg">
      <button
        type="button"
        onClick={onExpand}
        aria-label={`Expandir acompanhamento: ${title}`}
        className="flex items-center gap-2 pl-3 pr-2 py-1.5 min-w-0 text-left"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${live ? 'bg-telemetry-alert animate-pulse' : 'bg-telemetry-text-muted'}`} aria-hidden="true" />
        <span className="text-xs font-medium truncate max-w-[130px]">{title}</span>
        {summary && <span className="text-xs text-telemetry-text-muted whitespace-nowrap">{summary}</span>}
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label={`Fechar acompanhamento: ${title}`}
        className="pr-3 pl-1 py-1.5 text-telemetry-text-muted hover:text-telemetry-text-primary"
      >
        ×
      </button>
    </div>
  );
}
