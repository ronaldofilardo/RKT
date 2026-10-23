'use client';

interface PlayerCardRowProps {
  name: string;
  isServer: boolean;
  isReceiver: boolean;
  isPartner: boolean;
}

export function PlayerCardRow({ name, isServer, isReceiver, isPartner }: PlayerCardRowProps) {
  const sizeClass = isPartner ? 'text-xs sm:text-sm' : 'text-sm sm:text-lg';
  const colorClass = isPartner
    ? isServer
      ? 'text-telemetry-volt'
      : 'text-telemetry-text-muted'
    : `text-telemetry-text-primary ${isServer ? 'text-telemetry-volt' : ''}`;

  return (
    <div className="flex items-center gap-1.5 justify-center max-w-full">
      <span
        className={`font-bold ${sizeClass} ${colorClass} truncate max-w-[80%]`}
      >
        {name}
      </span>
      {isServer && (
        <span className="inline-flex items-center gap-1 flex-shrink-0" aria-label="Sacando">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-telemetry-volt animate-pulse shadow-[0_0_8px_rgba(204,255,0,0.6)]" />
          <span role="img" aria-label="Sacador" className="text-xs select-none leading-none">🎾</span>
        </span>
      )}
      {isReceiver && (
        <span className="text-[9px] font-bold px-1 py-0.2 bg-white/10 text-telemetry-text-muted rounded">
          REC
        </span>
      )}
    </div>
  );
}
