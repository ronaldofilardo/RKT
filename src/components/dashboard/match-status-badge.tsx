import Image from 'next/image';

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendada',
  IN_PROGRESS: 'Em Andamento',
  FINISHED: 'Finalizada',
  CANCELLED: 'Cancelada',
};

const STATUS_IMAGES: Record<string, { src: string; title: string; label: string }> = {
  IN_PROGRESS: { src: '/status/live.webp', title: 'Em andamento', label: 'Em Andamento' },
  FINISHED: { src: '/status/finalizada.webp', title: 'Partida finalizada', label: 'Finalizada' },
  SCHEDULED: { src: '/status/agendada.webp', title: 'Partida agendada', label: 'Agendada' },
};

interface MatchStatusBadgeProps {
  isSuspended: boolean;
  state: string;
}

export function MatchStatusBadge({ isSuspended, state }: MatchStatusBadgeProps) {
  if (!isSuspended && STATUS_IMAGES[state]) {
    const info = STATUS_IMAGES[state];
    return (
      <span
        title={info.title}
        className="inline-flex items-center gap-1.5 cursor-default"
      >
        <Image
          src={info.src}
          alt={info.title}
          width={40}
          height={28}
          className="h-7 w-auto object-contain"
          priority={state === 'IN_PROGRESS'}
        />
        <span className="sr-only">{info.title}</span>
        {state === 'FINISHED' ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-400 dark:bg-telemetry-volt/15 dark:text-telemetry-volt dark:border-telemetry-volt/40 inline-flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-telemetry-volt dark:shadow-[0_0_8px_rgba(204,255,0,0.8)]"></span>
            Finalizada
          </span>
        ) : (
          <span className="sr-only">{info.label}</span>
        )}
      </span>
    );
  }

  let badgeStyle = "bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-500/30 font-bold";
  if (isSuspended) {
    badgeStyle = "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-400 dark:border-amber-500/30 font-bold";
  } else if (state === "FINISHED") {
    badgeStyle = "bg-emerald-100 text-emerald-900 dark:bg-telemetry-volt/15 dark:text-telemetry-volt border border-emerald-400 dark:border-telemetry-volt/40 font-bold";
  } else if (state === "SCHEDULED") {
    badgeStyle = "bg-purple-100 text-purple-900 dark:bg-purple-500/15 dark:text-purple-300 border border-purple-400 dark:border-purple-500/30 font-bold";
  }

  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeStyle}`}>
      {isSuspended ? "Suspensa" : STATUS_LABELS[state] || state}
    </span>
  );
}


