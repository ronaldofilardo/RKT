'use client';

import { Athlete } from '../page';
import { AthleteDropdown } from './AthleteDropdown';

interface PlayerSelectionProps {
  athletes: Athlete[];
  selectedP1: Athlete | null;
  selectedP2: Athlete | null;
  player1DropdownOpen: boolean;
  player2DropdownOpen: boolean;
  onToggleP1: () => void;
  onToggleP2: () => void;
  onSelectP1: (athlete: Athlete | null) => void;
  onSelectP2: (athlete: Athlete | null) => void;
  onCreateNewP1: () => void;
  onCreateNewP2: () => void;
}

export function PlayerSelection({
  athletes,
  selectedP1,
  selectedP2,
  player1DropdownOpen,
  player2DropdownOpen,
  onToggleP1,
  onToggleP2,
  onSelectP1,
  onSelectP2,
  onCreateNewP1,
  onCreateNewP2,
}: PlayerSelectionProps) {
  return (
    <section className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <h2 className="text-base font-semibold text-gray-900 w-40 shrink-0">JOGADORES *</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
          <AthleteDropdown
            label="Jogador 1"
            athletes={athletes}
            selectedAthlete={selectedP1}
            excludedAthlete={selectedP2}
            isOpen={player1DropdownOpen}
            colorClass="sky"
            onToggle={onToggleP1}
            onSelect={onSelectP1}
            onCreateNew={onCreateNewP1}
          />
          <AthleteDropdown
            label="Jogador 2"
            athletes={athletes}
            selectedAthlete={selectedP2}
            excludedAthlete={selectedP1}
            isOpen={player2DropdownOpen}
            colorClass="emerald"
            onToggle={onToggleP2}
            onSelect={onSelectP2}
            onCreateNew={onCreateNewP2}
          />
        </div>
      </div>
    </section>
  );
}
