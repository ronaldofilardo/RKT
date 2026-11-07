export interface ServeOrderCardConfig {
  /** true = esta dupla está sacando; false = recebedora (aviso do Game 2). */
  isActive: boolean;
  borderClass: string;
  titleClass: string;
  receiverTitleClass: string;
  activeButtonClass: string;
  title: string;
  receiverTitle: string;
  activeId: string;
  options: Array<{ id: string; name: string }>;
  onSelect: (playerId: string) => void;
}

/** Coluna de ordem de saque de uma dupla: botões quando ela saca, aviso quando recebe. */
export function ServeOrderCard({
  isActive, borderClass, titleClass, receiverTitleClass, activeButtonClass,
  title, receiverTitle, activeId, options, onSelect,
}: ServeOrderCardConfig) {
  if (!isActive) {
    return (
      <div className="p-3 bg-telemetry-card/50 rounded-xl border border-white/5 flex flex-col justify-center text-center space-y-1">
        <span className={`text-xs font-bold block ${receiverTitleClass}`}>{receiverTitle}</span>
        <p className="text-[11px] text-telemetry-text-muted leading-relaxed">
          O 1º sacador será definido no Game 2 (Regra 14 ITF).
        </p>
      </div>
    );
  }
  return (
    <div className={`p-3 bg-telemetry-card rounded-xl border ${borderClass} space-y-2`}>
      <span className={`text-xs font-bold block ${titleClass}`}>{title}</span>
      <div className="flex flex-col gap-1.5">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={`py-2 px-3 text-xs rounded-lg text-left transition-all ${
              activeId === option.id
                ? activeButtonClass
                : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-white'
            }`}
          >
            1º: {option.name}
          </button>
        ))}
      </div>
    </div>
  );
}
