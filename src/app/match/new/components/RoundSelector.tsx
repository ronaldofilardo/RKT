'use client';

interface RoundSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const ROUND_OPTIONS = [
  { value: '1a rodada', label: '1a Rodada' },
  { value: 'oitavas', label: 'Oitavas' },
  { value: 'quartas', label: 'Quartas' },
  { value: 'semifinal', label: 'Semifinal' },
  { value: 'final', label: 'Final' },
];

export function RoundSelector({ value, onChange, placeholder }: RoundSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900"
      >
        <option value="" className="text-gray-900">{placeholder || 'Selecione a rodada'}</option>
        {ROUND_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} className="text-gray-900">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}