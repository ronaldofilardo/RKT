'use client';

interface PlayerCardRowProps {
  name: string;
  isServer: boolean;
  isReceiver: boolean;
  isPartner: boolean;
  onChangeServer?: () => void;
}

export function PlayerCardRow({ name, isServer, isReceiver, isPartner, onChangeServer }: PlayerCardRowProps) {
  const sizeClass = isPartner ? 'text-xs sm:text-sm' : 'text-sm sm:text-lg';
  const colorClass = isPartner
    ? isServer
      ? 'text-telemetry-volt font-black'
      : 'text-telemetry-text-muted'
    : `text-telemetry-text-primary ${isServer ? 'text-telemetry-volt font-black' : ''}`;

  return (
    <div className="flex items-center gap-1.5 justify-center max-w-full">
      <span
        className={`font-bold ${sizeClass} ${colorClass} truncate max-w-[80%]`}
      >
        {name}
      </span>
      {isServer && (
        <span
          className="inline-flex items-center gap-1 flex-shrink-0 cursor-pointer p-0.5 rounded hover:bg-white/10 active:scale-95 transition-transform"
          aria-label="Trocar sacador"
          title="Toque para trocar sacador"
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onChangeServer?.();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              e.preventDefault();
              onChangeServer?.();
            }
          }}
        >
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-telemetry-volt animate-pulse shadow-[0_0_8px_rgba(204,255,0,0.6)] ring-1 ring-black/20" />
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
