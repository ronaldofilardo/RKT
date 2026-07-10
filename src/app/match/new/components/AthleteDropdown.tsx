'use client';

import { Athlete } from '../page';

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
  const color = colorClass === 'sky' ? 'sky' : 'emerald';
  const colorClasses = {
    border: colorClass === 'sky' ? 'border-sky-200' : 'border-emerald-200',
    bgHover: colorClass === 'sky' ? 'hover:bg-sky-50' : 'hover:bg-emerald-50',
    bgSelected: colorClass === 'sky' ? 'bg-sky-100' : 'bg-emerald-100',
    bgHeader: colorClass === 'sky' ? 'bg-sky-50/50' : 'bg-emerald-50/50',
    borderHeader: colorClass === 'sky' ? 'border-sky-100' : 'border-emerald-100',
    textHeader: colorClass === 'sky' ? 'text-sky-900' : 'text-emerald-900',
    textSubheader: colorClass === 'sky' ? 'text-sky-600' : 'text-emerald-600',
    btnBg: colorClass === 'sky' ? 'bg-sky-500' : 'bg-emerald-500',
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full px-3 py-3 border border-gray-300 rounded-lg text-left flex items-center justify-between bg-white hover:border-${color}-400 text-gray-900`}
      >
        <span className={selectedAthlete ? 'text-gray-900 font-medium' : 'text-gray-500'}>
          {selectedAthlete?.name || 'Selecione...'}
        </span>
        <span className="text-gray-400 text-sm">▼</span>
      </button>
      {isOpen && (
        <div
          className={`absolute z-30 w-full mt-1 bg-white border-2 ${colorClasses.border} rounded-lg shadow-xl max-h-64 overflow-auto`}
        >
          <button
            type="button"
            onClick={onCreateNew}
            className={`w-full px-3 py-2 text-left ${colorClasses.bgHover} flex items-center gap-2 border-b ${colorClasses.borderHeader} ${colorClasses.bgHeader}`}
          >
            <span
              className={`w-7 h-7 rounded-full ${colorClasses.btnBg} text-white flex items-center justify-center font-bold text-lg`}
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
                <span className="font-medium text-gray-900">{a.name}</span>
                {a.ranking && (
                  <span className="text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                    #{a.ranking}
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-500 text-sm">Nenhum atleta</div>
          )}
        </div>
      )}
    </div>
  );
}