'use client';

import { RoundSelector } from './components';
import { TournamentAutocompleteInput } from './tournament-autocomplete-input';

interface TournamentSectionProps {
  tournamentName: string;
  setTournamentName: (v: string) => void;
  showTournamentDropdown: boolean;
  setShowTournamentDropdown: (v: boolean) => void;
  tournamentSuggestions: string[];
  selectTournamentFromSuggestions: (t: string) => void;
  clubName: string;
  setClubName: (v: string) => void;
  category: string;
  setCategory: (v: 'INFANTIL' | 'JUVENIL' | 'ADULTO' | 'VETERANO' | '') => void;
  setRoundName: (v: string) => void;
}

/** Seção Torneio (auto-complete), Clube e Rodada. */
export function TournamentSection({
  tournamentName,
  setTournamentName,
  showTournamentDropdown,
  setShowTournamentDropdown,
  tournamentSuggestions,
  selectTournamentFromSuggestions,
  clubName,
  setClubName,
  category,
  setCategory,
  setRoundName,
}: TournamentSectionProps) {
  return (
    <section className="bg-telemetry-card rounded-xl border border-white/10 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h2 className="text-base font-semibold text-telemetry-text-primary w-40 shrink-0">
          Torneio <span className="text-telemetry-text-muted font-normal">(opcional)</span>
        </h2>
        <TournamentAutocompleteInput
          tournamentName={tournamentName}
          setTournamentName={setTournamentName}
          showTournamentDropdown={showTournamentDropdown}
          setShowTournamentDropdown={setShowTournamentDropdown}
          tournamentSuggestions={tournamentSuggestions}
          selectTournamentFromSuggestions={selectTournamentFromSuggestions}
        />
      </div>

      {/* Clube */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
        <h2 className="text-base font-semibold text-telemetry-text-primary w-40 shrink-0">
          Clube <span className="text-telemetry-text-muted font-normal">(opcional)</span>
        </h2>
        <input
          type="text"
          value={clubName}
          onChange={(e) => setClubName(e.target.value)}
          placeholder="Nome do clube"
          className="flex-1 px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt text-base bg-telemetry-elevated text-telemetry-text-primary placeholder-telemetry-text-muted/50"
        />
      </div>

      {/* Rodada */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
        <h2 className="text-base font-semibold text-telemetry-text-primary w-40 shrink-0">
          Rodada <span className="text-telemetry-text-muted font-normal">(opcional)</span>
        </h2>
        <div className="flex-1 relative">
          <RoundSelector
            value={category}
            onChange={(val) => {
              setCategory(val as 'INFANTIL' | 'JUVENIL' | 'ADULTO' | 'VETERANO' | '');
              setRoundName(val);
            }}
            placeholder="Selecione a rodada"
          />
        </div>
      </div>
    </section>
  );
}
