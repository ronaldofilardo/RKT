'use client';

import { AthleteDropdown } from './AthleteDropdown';
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
  onToggleP1,
  onToggleP2,
  onToggleP1Partner,
  onToggleP2Partner,
  onSelectP1,
  onSelectP2,
  onSelectP1Partner,
  onSelectP2Partner,
  onCreateNewP1,
  onCreateNewP2,
  onCreateNewP1Partner,
  onCreateNewP2Partner,
}: PlayerSelectionProps) {
  const isDoubles = matchType === 'DOUBLES';

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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dupla 1 */}
            <div className="bg-telemetry-elevated/40 rounded-xl border border-sky-500/20 p-3 space-y-3">
              <div className="flex items-center gap-2 border-b border-sky-500/10 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  Dupla 1 (Lado A)
                </span>
              </div>
              <AthleteDropdown
                label="Jogador 1"
                athletes={athletes}
                selectedAthlete={selectedP1}
                excludedAthletes={[selectedP2, selectedP1Partner, selectedP2Partner]}
                isOpen={player1DropdownOpen}
                colorClass="sky"
                onToggle={onToggleP1}
                onSelect={onSelectP1}
                onCreateNew={onCreateNewP1}
              />
              <AthleteDropdown
                label="Parceiro 1"
                athletes={athletes}
                selectedAthlete={selectedP1Partner}
                excludedAthletes={[selectedP1, selectedP2, selectedP2Partner]}
                isOpen={player1PartnerDropdownOpen}
                colorClass="sky"
                onToggle={onToggleP1Partner || (() => {})}
                onSelect={onSelectP1Partner || (() => {})}
                onCreateNew={onCreateNewP1Partner || (() => {})}
              />
            </div>

            {/* Dupla 2 */}
            <div className="bg-telemetry-elevated/40 rounded-xl border border-emerald-500/20 p-3 space-y-3">
              <div className="flex items-center gap-2 border-b border-emerald-500/10 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Dupla 2 (Lado B)
                </span>
              </div>
              <AthleteDropdown
                label="Jogador 2"
                athletes={athletes}
                selectedAthlete={selectedP2}
                excludedAthletes={[selectedP1, selectedP1Partner, selectedP2Partner]}
                isOpen={player2DropdownOpen}
                colorClass="emerald"
                onToggle={onToggleP2}
                onSelect={onSelectP2}
                onCreateNew={onCreateNewP2}
              />
              <AthleteDropdown
                label="Parceiro 2"
                athletes={athletes}
                selectedAthlete={selectedP2Partner}
                excludedAthletes={[selectedP1, selectedP2, selectedP1Partner]}
                isOpen={player2PartnerDropdownOpen}
                colorClass="emerald"
                onToggle={onToggleP2Partner || (() => {})}
                onSelect={onSelectP2Partner || (() => {})}
                onCreateNew={onCreateNewP2Partner || (() => {})}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
