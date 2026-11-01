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
        className="inline-flex items-center justify-center cursor-default"
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
        <span className="sr-only">{info.label}</span>
      </span>
    );
  }

  let badgeStyle = "bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-500/30";
  if (isSuspended) {
    badgeStyle = "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30";
  } else if (state === "FINISHED") {
    badgeStyle = "bg-slate-200 text-slate-800 dark:bg-slate-700/50 dark:text-slate-200 border border-slate-300 dark:border-white/10";
  } else if (state === "SCHEDULED") {
    badgeStyle = "bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30";
  }

  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeStyle}`}>
      {isSuspended ? "Suspensa" : STATUS_LABELS[state] || state}
    </span>
  );
}


