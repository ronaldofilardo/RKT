import type { SelectablePlayer } from './ServerSelectionModal';

interface DoublesServeOrderSectionProps {
  activeFirstServerP1: string;
  activeFirstServerP2: string;
  onFirstServerP1: (playerId: string) => void;
  onFirstServerP2: (playerId: string) => void;
  selectedP1: SelectablePlayer;
  selectedP1Partner: SelectablePlayer;
  selectedP2: SelectablePlayer;
  selectedP2Partner: SelectablePlayer;
}

export function DoublesServeOrderSection({
  activeFirstServerP1,
  activeFirstServerP2,
  onFirstServerP1,
  onFirstServerP2,
  selectedP1,
  selectedP1Partner,
  selectedP2,
  selectedP2Partner,
}: DoublesServeOrderSectionProps) {
  const p1Id = selectedP1.id || '';
  const p1PartnerId = selectedP1Partner.id || '';
  const p2Id = selectedP2.id || '';
  const p2PartnerId = selectedP2Partner.id || '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
      {/* Sacador 1 da Dupla 1 */}
      <div className="p-3 bg-telemetry-card rounded-xl border border-sky-500/20 space-y-2">
        <span className="text-xs font-bold text-sky-400 block">
          Quem saca 1º na Dupla 1?
        </span>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => onFirstServerP1(p1Id)}
            className={`py-2 px-3 text-xs rounded-lg text-left transition-all ${
              activeFirstServerP1 === p1Id
                ? 'bg-telemetry-blue text-white font-bold'
                : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-white'
            }`}
          >
            1º: {selectedP1.name}
          </button>
          <button
            type="button"
            onClick={() => onFirstServerP1(p1PartnerId)}
            className={`py-2 px-3 text-xs rounded-lg text-left transition-all ${
              activeFirstServerP1 === p1PartnerId
                ? 'bg-telemetry-blue text-white font-bold'
                : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-white'
            }`}
          >
            1º: {selectedP1Partner.name}
          </button>
        </div>
      </div>

      {/* Sacador 1 da Dupla 2 */}
      <div className="p-3 bg-telemetry-card rounded-xl border border-emerald-500/20 space-y-2">
        <span className="text-xs font-bold text-emerald-400 block">
          Quem saca 1º na Dupla 2?
        </span>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => onFirstServerP2(p2Id)}
            className={`py-2 px-3 text-xs rounded-lg text-left transition-all ${
              activeFirstServerP2 === p2Id
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-white'
            }`}
          >
            1º: {selectedP2.name}
          </button>
          <button
            type="button"
            onClick={() => onFirstServerP2(p2PartnerId)}
            className={`py-2 px-3 text-xs rounded-lg text-left transition-all ${
              activeFirstServerP2 === p2PartnerId
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-white'
            }`}
          >
            1º: {selectedP2Partner.name}
          </button>
        </div>
      </div>
    </div>
  );
}
