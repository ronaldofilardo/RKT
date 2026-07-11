'use client';

import { useState, useEffect } from 'react';

interface RoundSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const ROUND_OPTIONS = [
  { value: 'abertura', label: 'Abertura' },
  { value: 'oitavas', label: 'Oitavas' },
  { value: 'quartas', label: 'Quartas' },
  { value: 'semifinal', label: 'Semifinal' },
  { value: 'final', label: 'Final' },
  { value: 'outras', label: 'Outras' },
];

export function RoundSelector({ value, onChange, placeholder }: RoundSelectorProps) {
  const [isOtherMode, setIsOtherMode] = useState(false);
  const [otherInput, setOtherInput] = useState('');

  useEffect(() => {
    const isCurrentlyOther = !ROUND_OPTIONS.some(opt => opt.value === value);
    if (isCurrentlyOther) {
      setIsOtherMode(true);
      setOtherInput(value);
    } else if (value === 'outras') {
      setIsOtherMode(true);
      setOtherInput('');
    } else {
      setIsOtherMode(false);
    }
  }, [value]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue === 'outras') {
      setIsOtherMode(true);
      setOtherInput('');
      onChange('');
    } else {
      setIsOtherMode(false);
      setOtherInput('');
      onChange(selectedValue);
    }
  };

  const handleOtherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setOtherInput(newValue);
    onChange(newValue);
  };

  return (
    <div className="flex flex-col gap-2">
      <select
        value={isOtherMode ? 'outras' : value}
        onChange={handleSelectChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900"
      >
        <option value="" className="text-gray-900">Selecione a rodada</option>
        {ROUND_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} className="text-gray-900">
            {option.label}
          </option>
        ))}
      </select>

      {isOtherMode && (
        <input
          type="text"
          value={otherInput}
          onChange={handleOtherChange}
          placeholder={placeholder || 'Digite o nome da rodada'}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 placeholder-gray-500"
        />
      )}
    </div>
  );
}