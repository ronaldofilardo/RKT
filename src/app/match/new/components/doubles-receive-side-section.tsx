import type { SelectablePlayer } from './ServerSelectionModal';

interface DoublesReceiveSideSectionProps {
  activeReceiveDeuceP1: string;
  activeReceiveDeuceP2: string;
  onReceiveDeuceP1: (playerId: string) => void;
  onReceiveDeuceP2: (playerId: string) => void;
  selectedP1: SelectablePlayer;
  selectedP1Partner: SelectablePlayer;
  selectedP2: SelectablePlayer;
  selectedP2Partner: SelectablePlayer;
}

export function DoublesReceiveSideSection({
  activeReceiveDeuceP1,
  activeReceiveDeuceP2,
  onReceiveDeuceP1,
  onReceiveDeuceP2,
  selectedP1,
  selectedP1Partner,
  selectedP2,
  selectedP2Partner,
}: DoublesReceiveSideSectionProps) {
  const p1Id = selectedP1.id || '';
  const p1PartnerId = selectedP1Partner.id || '';
  const p2Id = selectedP2.id || '';
  const p2PartnerId = selectedP2Partner.id || '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Recepção Deuce Dupla 1 */}
      <div className="p-3 bg-telemetry-card rounded-xl border border-sky-500/20 space-y-2">
        <span className="text-xs font-bold text-sky-400 block">
          Recebedor no Deuce (Lado Direito) - Dupla 1
        </span>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => onReceiveDeuceP1(p1Id)}
            className={`py-2 px-3 text-xs rounded-lg text-left transition-all ${
              activeReceiveDeuceP1 === p1Id
                ? 'bg-telemetry-blue text-white font-bold'
                : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-white'
            }`}
          >
            Deuce: {selectedP1.name}
          </button>
          <button
            type="button"
            onClick={() => onReceiveDeuceP1(p1PartnerId)}
            className={`py-2 px-3 text-xs rounded-lg text-left transition-all ${
              activeReceiveDeuceP1 === p1PartnerId
                ? 'bg-telemetry-blue text-white font-bold'
                : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-white'
            }`}
          >
            Deuce: {selectedP1Partner.name}
          </button>
        </div>
      </div>

      {/* Recepção Deuce Dupla 2 */}
      <div className="p-3 bg-telemetry-card rounded-xl border border-emerald-500/20 space-y-2">
        <span className="text-xs font-bold text-emerald-400 block">
          Recebedor no Deuce (Lado Direito) - Dupla 2
        </span>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => onReceiveDeuceP2(p2Id)}
            className={`py-2 px-3 text-xs rounded-lg text-left transition-all ${
              activeReceiveDeuceP2 === p2Id
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-white'
            }`}
          >
            Deuce: {selectedP2.name}
          </button>
          <button
            type="button"
            onClick={() => onReceiveDeuceP2(p2PartnerId)}
            className={`py-2 px-3 text-xs rounded-lg text-left transition-all ${
              activeReceiveDeuceP2 === p2PartnerId
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-white'
            }`}
          >
            Deuce: {selectedP2Partner.name}
          </button>
        </div>
      </div>
    </div>
  );
}
