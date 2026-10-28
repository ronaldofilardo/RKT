'use client';
import { AthleteDropdown } from './AthleteDropdown';
import { DoublesPlayerPair } from './doubles-player-pair';
import { MatchTypeToggle } from './match-type-toggle';
import type { PlayerSelectionProps } from './player-selection.types';
export type { PlayerSelectionProps } from './player-selection.types';
export function PlayerSelection({
  matchType = 'SINGLES',
  onMatchTypeChange,
  athletes,
  selectedP1,
  selectedP2,
  selectedP1Partner = null,
  selectedP2Partner = null,
  player1DropdownOpen,
  player2DropdownOpen,
  player1PartnerDropdownOpen = false,
  player2PartnerDropdownOpen = false,
  onToggleP1, onToggleP2, onToggleP1Partner, onToggleP2Partner,
  onSelectP1, onSelectP2, onSelectP1Partner, onSelectP2Partner,
  onCreateNewP1, onCreateNewP2, onCreateNewP1Partner, onCreateNewP2Partner,
  myClub = false,
  ctId = null,
}: PlayerSelectionProps) {
  const isDoubles = matchType === 'DOUBLES';
  const filteredAthletes = myClub && ctId
    ? athletes.filter((a) => a.playerCts?.some((pc) => pc.ctId === ctId) || a.clubId === ctId)
    : athletes;
  return (
    <section className="bg-telemetry-card rounded-xl border border-white/10 p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <h2 className="text-base font-semibold text-telemetry-text-primary">
            MODALIDADE & JOGADORES *
          </h2>
          <MatchTypeToggle isDoubles={isDoubles} onMatchTypeChange={onMatchTypeChange} />
        </div>
        {!isDoubles ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AthleteDropdown
              label="Jogador 1"
              athletes={filteredAthletes}
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
              athletes={filteredAthletes}
              selectedAthlete={selectedP2}
              excludedAthlete={selectedP1}
              isOpen={player2DropdownOpen}
              colorClass="emerald"
              onToggle={onToggleP2}
              onSelect={onSelectP2}
              onCreateNew={onCreateNewP2}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DoublesPlayerPair
              accent="sky"
              title="Dupla 1 (Lado A)"
              athletes={filteredAthletes}
              primary={{
                label: 'Jogador 1', selected: selectedP1, isOpen: player1DropdownOpen,
                excluded: [selectedP2, selectedP1Partner, selectedP2Partner],
                onToggle: onToggleP1, onSelect: onSelectP1, onCreateNew: onCreateNewP1,
              }}
              partner={{
                label: 'Parceiro 1', selected: selectedP1Partner, isOpen: player1PartnerDropdownOpen,
                excluded: [selectedP1, selectedP2, selectedP2Partner],
                onToggle: onToggleP1Partner, onSelect: onSelectP1Partner, onCreateNew: onCreateNewP1Partner,
              }}
            />
            <DoublesPlayerPair
              accent="emerald"
              title="Dupla 2 (Lado B)"
              athletes={filteredAthletes}
              primary={{
                label: 'Jogador 2', selected: selectedP2, isOpen: player2DropdownOpen,
                excluded: [selectedP1, selectedP1Partner, selectedP2Partner],
                onToggle: onToggleP2, onSelect: onSelectP2, onCreateNew: onCreateNewP2,
              }}
              partner={{
                label: 'Parceiro 2', selected: selectedP2Partner, isOpen: player2PartnerDropdownOpen,
                excluded: [selectedP1, selectedP2, selectedP1Partner],
                onToggle: onToggleP2Partner, onSelect: onSelectP2Partner, onCreateNew: onCreateNewP2Partner,
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}