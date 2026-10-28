'use client';

import type { GestorTab } from './types';

interface TabNavProps {
  tab: GestorTab;
  onTabChange: (tab: GestorTab) => void;
  matchesCount?: number;
}

export function TabNav({ tab, onTabChange, matchesCount }: TabNavProps) {
  const tabs: Array<{ key: GestorTab; label: string; badge?: number }> = [
    { key: 'coaches', label: 'Treinadores' },
    { key: 'athletes', label: 'Atletas' },
    { key: 'matches', label: 'Partidas do Clube', badge: matchesCount },
    { key: 'club', label: 'Dados do Clube' },
    { key: 'managers', label: 'Gestores' },
  ];

  return (
    <div className="flex gap-2 mb-4 border-b border-gray-200 pb-2 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onTabChange(t.key)}
          className={`px-3 py-2 text-sm font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap ${tab === t.key
            ? 'border-sky-600 text-sky-600 font-semibold'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          {t.label}
          {typeof t.badge === 'number' && t.badge > 0 && (
            <span className="bg-sky-100 text-sky-700 text-xs px-1.5 py-0.2 rounded-full font-bold">
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
