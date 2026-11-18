import type { CoachItem } from './types';

interface CoachListProps {
  coaches: CoachItem[];
  selectedCoachIds: string[];
  onToggleCoach: (coachId: string) => void;
}

export function IndicarAnotadorCoachList({
  coaches,
  selectedCoachIds,
  onToggleCoach,
}: CoachListProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-telemetry-text-muted block">
          Membros anotadores ou treinadores ({selectedCoachIds.length} selecionado(s))
        </span>
      </div>

      <div className="max-h-52 overflow-y-auto space-y-1.5 p-1 rounded-lg border border-white/10 bg-telemetry-elevated/40">
        {coaches.length === 0 ? (
          <p className="text-xs text-telemetry-text-muted p-3 text-center">Nenhum treinador cadastrado no clube.</p>
        ) : (
          coaches.map((c) => {
            const isChecked = selectedCoachIds.includes(c.user.id);
            return (
              <label
                key={c.user.id}
                htmlFor={`coach-${c.user.id}`}
                className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-sm border ${
                  isChecked
                    ? 'bg-telemetry-blue/15 border-telemetry-blue-light/30 text-telemetry-text-primary'
                    : 'border-transparent hover:bg-white/5 text-telemetry-text-muted'
                }`}
              >
                <input
                  id={`coach-${c.user.id}`}
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleCoach(c.user.id)}
                  className="w-4 h-4 rounded border-white/20 bg-telemetry-card text-telemetry-blue focus:ring-0 cursor-pointer"
                />
                <span className="flex-1 min-w-0 font-medium text-telemetry-text-primary block truncate">
                  {c.user.name} ({c.user.email})
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
