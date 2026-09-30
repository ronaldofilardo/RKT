'use client';

import type { Athlete } from '../types';

interface AthleteDropdownProps {
  label: string;
  athletes: Athlete[];
  selectedAthlete: Athlete | null;
  excludedAthlete: Athlete | null;
  isOpen: boolean;
  colorClass: 'sky' | 'emerald';
  onToggle: () => void;
  onSelect: (athlete: Athlete | null) => void;
  onCreateNew: () => void;
}

export function AthleteDropdown({
  label,
  athletes,
  selectedAthlete,
  excludedAthlete,
  isOpen,
  colorClass,
  onToggle,
  onSelect,
  onCreateNew,
}: AthleteDropdownProps) {
  const filtered = athletes.filter((a) => a.id !== excludedAthlete?.id);
  const colorClasses = {
    border: 'border-white/10',
    bgHover: 'hover:bg-white/',
    bgSelected: colorClass === 'sky' ? 'bg-telemetry-blue/10' : 'bg-telemetry-volt/10 text-telemetry-volt',
    bgHeader: 'bg-telemetry-elevated',
    borderHeader: 'border-white/10',
    textHeader: 'text-telemetry-text-primary',
    textSubheader: 'text-telemetry-text-muted',
    btnBg: colorClass === 'sky' ? 'bg-telemetry-blue text-white' : 'bg-telemetry-volt text-black',
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-telemetry-text-muted mb-2">{label}</label>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full px-3 py-3 border border-white/10 rounded-lg text-left flex items-center justify-between bg-telemetry-elevated hover:border-white/20 text-telemetry-text-primary`}
      >
        <span className={selectedAthlete ? 'text-telemetry-text-primary font-medium' : 'text-telemetry-text-muted/50'}>
          {selectedAthlete?.name || 'Selecione...'}
        </span>
        <span className="text-telemetry-text-muted text-sm">▼</span>
      </button>
      {isOpen && (
        <div
          className={`absolute z-30 w-full mt-1 bg-telemetry-card border ${colorClasses.border} rounded-lg shadow-xl max-h-64 overflow-auto`}
        >
          <button
            type="button"
            onClick={onCreateNew}
            className={`w-full px-3 py-2 text-left ${colorClasses.bgHover} flex items-center gap-2 border-b ${colorClasses.borderHeader} ${colorClasses.bgHeader}`}
          >
            <span
              className={`w-7 h-7 rounded-full ${colorClasses.btnBg} flex items-center justify-center font-bold text-lg`}
            >
              +
            </span>
            <div>
              <span className={`font-semibold ${colorClasses.textHeader}`}>Novo atleta</span>
              <p className={`text-xs ${colorClasses.textSubheader}`}>Cadastrar novo jogador</p>
            </div>
          </button>
          {filtered.length > 0 ? (
            filtered.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onSelect(a)}
                className={`w-full px-3 py-2 text-left ${colorClasses.bgHover} flex items-center justify-between ${
                  selectedAthlete?.id === a.id ? colorClasses.bgSelected : ''
                }`}
              >
                <span className="font-medium text-telemetry-text-primary">{a.name}</span>
                {a.ranking && (
                  <span className="text-xs text-telemetry-text-muted bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                    #{a.ranking}
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-telemetry-text-muted/50 text-sm">Nenhum atleta</div>
          )}
        </div>
      )}
    </div>
  );
}
