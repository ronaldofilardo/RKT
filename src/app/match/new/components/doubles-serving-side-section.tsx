import type { SelectablePlayer } from './ServerSelectionModal';

interface DoublesServingSideSectionProps {
  servingSide: 'player1' | 'player2';
  onServingSideChange: (side: 'player1' | 'player2') => void;
  selectedP1: SelectablePlayer;
  selectedP1Partner: SelectablePlayer;
  selectedP2: SelectablePlayer;
  selectedP2Partner: SelectablePlayer;
}

export function DoublesServingSideSection({
  servingSide,
  onServingSideChange,
  selectedP1,
  selectedP1Partner,
  selectedP2,
  selectedP2Partner,
}: DoublesServingSideSectionProps) {
  return (
    <div className="mb-5 space-y-2">
      <label className="text-xs font-bold text-telemetry-text-muted uppercase tracking-wider block">
        1. Qual dupla começa no saque?
      </label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onServingSideChange('player1')}
          className={`p-3 rounded-xl border text-left transition-all ${
            servingSide === 'player1'
              ? 'border-sky-500 bg-sky-500/10 text-white font-semibold'
              : 'border-white/10 hover:border-white/20 text-telemetry-text-muted'
          }`}
        >
          <div className="text-xs font-bold text-sky-400 mb-0.5">Dupla 1</div>
          <div className="text-sm truncate font-medium text-telemetry-text-primary">
            {selectedP1.name} &amp; {selectedP1Partner.name}
          </div>
        </button>
        <button
          type="button"
          onClick={() => onServingSideChange('player2')}
          className={`p-3 rounded-xl border text-left transition-all ${
            servingSide === 'player2'
              ? 'border-emerald-500 bg-emerald-500/10 text-white font-semibold'
              : 'border-white/10 hover:border-white/20 text-telemetry-text-muted'
          }`}
        >
          <div className="text-xs font-bold text-emerald-400 mb-0.5">Dupla 2</div>
          <div className="text-sm truncate font-medium text-telemetry-text-primary">
            {selectedP2.name} &amp; {selectedP2Partner.name}
          </div>
        </button>
      </div>
    </div>
  );
}
